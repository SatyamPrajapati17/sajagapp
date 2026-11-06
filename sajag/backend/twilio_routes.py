"""
Sajag AI — Twilio Telephony Webhook Routes & Lookup v2 Integration
Implements BACKEND_MODULES.md §2.
"""

import os
import json
import logging
import asyncio
import httpx
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, Form, Response, HTTPException
from store import create_or_init_call, update_call, update_call_meta, emit, audit, get_call, save_turn
from engine import step, CALL_STATES

logger = logging.getLogger("sajag.twilio")
twilio_router = APIRouter(prefix="/twilio", tags=["Twilio Telephony"])

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
RETELL_API_KEY = os.getenv("RETELL_API_KEY", "")
RETELL_AGENT_ID = os.getenv("RETELL_AGENT_ID", "")
RETELL_SIP_HOST = os.getenv("RETELL_SIP_HOST", "sip.retellai.com")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")


async def run_twilio_lookup_v2(phone_number: str, call_id: str) -> Dict[str, Any]:
    """
    Twilio Lookup v2: queries valid, calling_country_code, national_format,
    country_code, phone_number, and optional line_type_intelligence.
    Never fails caller path; logs and saves gracefully.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not phone_number:
        logger.info("Twilio Lookup v2 skipped: credentials or number not available")
        return {}

    clean_number = phone_number.strip().replace(" ", "")
    lookup_url = f"https://lookups.twilio.com/v2/PhoneNumbers/{clean_number}"
    auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    lookup_data: Dict[str, Any] = {}

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # 1. Attempt lookup with line_type_intelligence
            resp = await client.get(
                f"{lookup_url}?Fields=line_type_intelligence",
                auth=auth
            )
            if resp.status_code == 200:
                raw = resp.json()
                lookup_data = {
                    "valid": raw.get("valid", True),
                    "calling_country_code": raw.get("calling_country_code"),
                    "country_code": raw.get("country_code"),
                    "national_format": raw.get("national_format"),
                    "phone_number": raw.get("phone_number", clean_number),
                    "line_type_intelligence": raw.get("line_type_intelligence") or {}
                }
            elif resp.status_code in (400, 403, 404):
                # Fallback to standard Lookup v2 without extra packages
                fallback_resp = await client.get(lookup_url, auth=auth)
                if fallback_resp.status_code == 200:
                    raw = fallback_resp.json()
                    lookup_data = {
                        "valid": raw.get("valid", True),
                        "calling_country_code": raw.get("calling_country_code"),
                        "country_code": raw.get("country_code"),
                        "national_format": raw.get("national_format"),
                        "phone_number": raw.get("phone_number", clean_number),
                        "line_type_intelligence": {"carrier_name": "Standard carrier", "type": "unknown"}
                    }
    except Exception as e:
        logger.warning("Twilio Lookup v2 request error: %s", e)
        lookup_data = {
            "valid": True,
            "phone_number": clean_number,
            "error": str(e)
        }

    if lookup_data:
        update_call_meta(call_id, lookup_meta=lookup_data)
        logger.info("Saved Twilio Lookup v2 for call %s: %s", call_id, lookup_data.get("phone_number"))

    return lookup_data


@twilio_router.post("/voice")
async def twilio_voice_webhook(request: Request):
    """
    Twilio Voice Inbound Webhook (BACKEND_MODULES §2).
    Captures 17 telephony fields, stores in calls.twilio_meta, triggers Lookup v2,
    and returns TwiML connecting the call to Retell Custom-LLM stream.
    """
    form_data = await request.form()
    
    # 1. Extract 17 telephony fields from Twilio request
    call_sid = form_data.get("CallSid", f"call-{int(asyncio.get_event_loop().time() * 1000)}")
    from_number = form_data.get("From", "")
    to_number = form_data.get("To", "")
    direction = form_data.get("Direction", "inbound")
    call_status = form_data.get("CallStatus", "ringing")

    twilio_meta = {
        "CallSid": call_sid,
        "AccountSid": form_data.get("AccountSid", ""),
        "From": from_number,
        "To": to_number,
        "Direction": direction,
        "CallStatus": call_status,
        "CallerName": form_data.get("CallerName", ""),
        "FromCity": form_data.get("FromCity", ""),
        "FromState": form_data.get("FromState", ""),
        "FromZip": form_data.get("FromZip", ""),
        "FromCountry": form_data.get("FromCountry", ""),
        "ToCity": form_data.get("ToCity", ""),
        "ToState": form_data.get("ToState", ""),
        "ToCountry": form_data.get("ToCountry", ""),
        "ForwardedFrom": form_data.get("ForwardedFrom", ""),
        "ApiVersion": form_data.get("ApiVersion", ""),
        "CallToken": form_data.get("CallToken", ""),
    }

    logger.info("Twilio Inbound Call received: SID=%s From=%s To=%s", call_sid, from_number, to_number)

    # 2. Initialize call in store
    create_or_init_call(call_sid, channel="phone", from_num=from_number, to_num=to_number)
    update_call_meta(call_sid, twilio_meta=twilio_meta)

    # 3. Trigger Twilio Lookup v2 asynchronously
    if from_number:
        asyncio.create_task(run_twilio_lookup_v2(from_number, call_sid))

    # 4. Trigger Retell phone call registration if keys are configured
    if RETELL_API_KEY and RETELL_AGENT_ID and not RETELL_API_KEY.startswith("mock"):
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                retell_resp = await client.post(
                    "https://api.retellai.com/v2/register-phone-call",
                    headers={"Authorization": f"Bearer {RETELL_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "agent_id": RETELL_AGENT_ID,
                        "direction": "inbound",
                        "from_number": from_number,
                        "to_number": to_number
                    }
                )
                logger.info("Retell register-phone-call status: %s", retell_resp.status_code)
        except Exception as e:
            logger.warning("Retell register-phone-call notice: %s", e)

    # 5. Build TwiML response
    FORWARD_TO_REAL_PHONE = os.getenv("FORWARD_TO_REAL_PHONE", "false").lower() == "true"
    USE_NATIVE_TWILIO_VOICE = os.getenv("USE_NATIVE_TWILIO_VOICE", "true").lower() == "true"
    family_phone = os.getenv("FAMILY_PHONE", "+919922996010")

    pub_host = PUBLIC_BASE_URL.replace("https://", "").replace("http://", "")
    ws_protocol = "wss" if "https" in PUBLIC_BASE_URL or "ngrok" in PUBLIC_BASE_URL else "ws"
    ws_url = f"{ws_protocol}://{pub_host}/llm-ws/{call_sid}"

    if FORWARD_TO_REAL_PHONE and family_phone and from_number != family_phone:
        # Forward call to user's real phone
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial timeout="25" callerId="{to_number}">{family_phone}</Dial>
</Response>"""
        logger.info("Forwarding inbound call %s to real phone %s", call_sid, family_phone)
    elif USE_NATIVE_TWILIO_VOICE:
        # Starting script: Victim casually answers the incoming scam call
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="hi-IN">Hello? Kaun bol raha hai?</Say>
    <Gather input="speech" action="{PUBLIC_BASE_URL}/twilio/turn/{call_sid}" method="POST" speechTimeout="auto" language="hi-IN,en-IN" timeout="5">
    </Gather>
</Response>"""
        logger.info("Starting natural victim screening for call %s: 'Hello? Kaun bol raha hai?'", call_sid)
    else:
        # Return standard TwiML with Connect Stream to Retell Custom-LLM
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{ws_url}">
            <Parameter name="call_sid" value="{call_sid}" />
            <Parameter name="from" value="{from_number}" />
        </Stream>
    </Connect>
</Response>"""

    audit("twilio", "inbound_call_connected", "calls", call_sid, {"from": from_number, "to": to_number})
    return Response(content=twiml, media_type="application/xml")


@twilio_router.post("/turn/{call_sid}")
async def twilio_turn_webhook(call_sid: str, request: Request):
    """
    Twilio Interactive Voice Turn Webhook:
    Receives caller speech transcription, processes it through LangGraph Guardian -> Decoy,
    extracts suspect mule handles, and returns TwiML with the next speech turn or call forwarding.
    """
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "").strip()
    logger.info("Twilio Turn Speech [%s]: '%s'", call_sid, speech_result)

    family_phone = os.getenv("FAMILY_PHONE", "+919922996010")

    if not speech_result:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">Hello? Beta awaaz nahi aayi, kaun bol rahe hain?</Say>
    <Gather input="speech" action="{PUBLIC_BASE_URL}/twilio/turn/{call_sid}" method="POST" speechTimeout="auto" language="en-IN" timeout="5" />
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # Update state and execute LangGraph turn
    state = CALL_STATES.setdefault(call_sid, {
        "call_id": call_sid,
        "mode": "MONITOR",
        "p_scam": 0.0,
        "turns": []
    })
    turns = list(state.get("turns", []))
    turns.append({"role": "caller", "text": speech_result})
    save_turn(call_sid, len(turns), speaker="caller", text=speech_result)

    # Step LangGraph engine
    out = await step(call_sid, turns)
    reply = out.get("reply", "Haan ji sahab, main sun raha hoon.")
    turns.append({"role": "agent", "text": reply})
    save_turn(call_sid, len(turns), speaker="agent", text=reply)
    CALL_STATES[call_sid]["turns"] = turns

    p_scam = out.get("p_scam", 0.0)
    mode = out.get("mode", "MONITOR")
    logger.info("LangGraph Turn Result [%s]: p_scam=%.2f, mode=%s, reply='%s'", call_sid, p_scam, mode, reply)

    # If benign caller after multiple turns, auto-forward to real family phone
    if mode == "MONITOR" and p_scam < 0.35 and len(turns) >= 4 and os.getenv("AUTO_FORWARD_BENIGN", "false").lower() == "true":
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">Accha thik hai, main call connect kar raha hoon.</Say>
    <Dial timeout="20">{family_phone}</Dial>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # If scammer detected, divert to Decoy Agent
    events = out.get("events", [])
    if "takeover_started" in events or mode in ("PENDING", "DECOY") or p_scam >= 0.88:
        # Scam detected! Divert call to Ramesh Sharma Decoy with the authentic elder voice recording
        speech_or_play = f"<Play>{PUBLIC_BASE_URL}/audio/ramesh_voice.mp3</Play>"
        logger.info("Scam detected! Diverted call %s to Decoy Agent playing authentic elder audio", call_sid)
    else:
        speech_or_play = f'<Say voice="Polly.Aditi" language="hi-IN">{reply}</Say>'

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    {speech_or_play}
    <Gather input="speech" action="{PUBLIC_BASE_URL}/twilio/turn/{call_sid}" method="POST" speechTimeout="auto" language="hi-IN,en-IN" timeout="6">
    </Gather>
</Response>"""
    return Response(content=twiml, media_type="application/xml")



@twilio_router.post("/status")
async def twilio_status_callback(request: Request):
    """
    Twilio Status Callback Webhook (BACKEND_MODULES §2).
    Captures: CallStatus, CallDuration, Timestamp, SipResponseCode, CallbackSource.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    call_status = form_data.get("CallStatus", "completed")
    call_duration = int(form_data.get("CallDuration", 0) or 0)
    timestamp = form_data.get("Timestamp", "")
    sip_code = form_data.get("SipResponseCode", "")
    callback_source = form_data.get("CallbackSource", "")

    logger.info("Twilio Status Callback: SID=%s Status=%s Duration=%ss", call_sid, call_status, call_duration)

    if call_sid:
        status_meta = {
            "CallStatus": call_status,
            "CallDuration": call_duration,
            "Timestamp": timestamp,
            "SipResponseCode": sip_code,
            "CallbackSource": callback_source
        }
        update_call_meta(call_sid, twilio_meta=status_meta)

        if call_status in ("completed", "busy", "no-answer", "failed", "canceled"):
            update_call(call_sid, {
                "state": "ENDED",
                "duration_s": call_duration
            })
            call_record = get_call(call_sid) or {}
            await emit("call_ended", call_sid, call_record)
            audit("twilio", "call_status_updated", "calls", call_sid, status_meta)

    return {"status": "ok", "call_sid": call_sid}


@twilio_router.post("/intercept-to-bot/{call_sid}")
async def intercept_call_to_bot(call_sid: str):
    """
    Dynamically intercepts an active call (e.g. ringing or speaking with human)
    and diverts it straight to Ramesh Sharma AI decoy bot.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=400, detail="Twilio credentials not configured")
    
    pub_host = PUBLIC_BASE_URL.replace("https://", "").replace("http://", "")
    ws_protocol = "wss" if "https" in PUBLIC_BASE_URL or "ngrok" in PUBLIC_BASE_URL else "ws"
    ws_url = f"{ws_protocol}://{pub_host}/llm-ws/{call_sid}"
    
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Please hold, connecting you to Ramesh Sharma.</Say>
    <Connect>
        <Stream url="{ws_url}">
            <Parameter name="call_sid" value="{call_sid}" />
        </Stream>
    </Connect>
</Response>"""
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        updated = client.calls(call_sid).update(twiml=twiml)
        logger.info("Call %s successfully intercepted and routed to Ramesh bot: status=%s", call_sid, updated.status)
        return {"status": "success", "call_sid": call_sid, "twilio_status": updated.status}
    except Exception as e:
        logger.error("Failed to intercept call %s: %s", call_sid, e)
        raise HTTPException(status_code=500, detail=str(e))


