"""
Sajag AI — Retell AI Integration Routes & WebSocket Protocol.
Implements BACKEND_MODULES.md §3.
Handles Custom-LLM WebSocket streaming, web-call tokens, and Retell lifecycle webhooks.
"""

import os
import json
import time
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Header, HTTPException
from pydantic import BaseModel
import httpx
from engine import step
from store import create_or_init_call, update_call, emit, audit

logger = logging.getLogger("sajag.retell")
retell_router = APIRouter(tags=["Retell AI Integration"])

RETELL_API_KEY = os.getenv("RETELL_API_KEY", "")
RETELL_AGENT_ID = os.getenv("RETELL_AGENT_ID", "")


class WebCallRequest(BaseModel):
    agent_id: Optional[str] = None


@retell_router.post("/web-call")
async def create_web_call(req: WebCallRequest):
    """
    Generates a Retell web-call access token for in-browser audio calls.
    Allows testing voice directly from the Next.js browser console.
    """
    retell_key = os.getenv("RETELL_API_KEY", "")
    agent_id = req.agent_id or os.getenv("RETELL_AGENT_ID", "")

    if not retell_key or retell_key.startswith("mock") or not agent_id or agent_id.startswith("mock"):
        # Local mock session token when running offline or without credentials
        mock_id = f"mock-web-{int(time.time())}"
        create_or_init_call(mock_id, channel="web")
        return {
            "access_token": f"mock_token_{mock_id}",
            "call_id": mock_id,
            "demo_mode": True,
            "message": "Retell keys not provided; returning local mock web call token."
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.retellai.com/v2/create-web-call",
                headers={"Authorization": f"Bearer {retell_key}", "Content-Type": "application/json"},
                json={"agent_id": agent_id}
            )
            data = resp.json()
            retell_call_id = data.get("call_id")
            if retell_call_id:
                create_or_init_call(retell_call_id, channel="web")
            return data
    except Exception as e:
        logger.error("Failed to create Retell web call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@retell_router.post("/retell/webhook")
async def retell_webhook(request: Request, x_retell_signature: Optional[str] = Header(None)):
    """
    Retell AI Lifecycle Webhook. Finalizes call, updates durations, and triggers report draft.
    """
    body_bytes = await request.body()
    try:
        data = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = data.get("event")
    call_data = data.get("call", {})
    call_id = call_data.get("call_id")

    logger.info("Retell Webhook event: %s for call: %s", event, call_id)

    if event == "call_started":
        create_or_init_call(
            call_id,
            channel="phone",
            from_num=call_data.get("from_number", ""),
            to_num=call_data.get("to_number", "")
        )
        await emit("call_started", call_id, {"mode": "MONITOR"})

    elif event in ("call_ended", "call_analyzed"):
        update_call(call_id, {
            "state": "ENDED",
            "duration_s": call_data.get("duration_ms", 0) // 1000,
            "ended_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })
        await emit("call_ended", call_id, {"mode": "ENDED"})

    return {"status": "received"}


@retell_router.websocket("/llm-ws/{call_id}")
async def llm_websocket_endpoint(websocket: WebSocket, call_id: str):
    """
    Retell Custom-LLM WebSocket Server.
    Streaming bi-directional bridge between Retell audio and LangGraph agents.
    Maintains the SAME agent and ElevenLabs voice (Ramesh Sharma) across both
    passive monitoring and active decoy baiting.
    """
    await websocket.accept()
    logger.info("Retell Custom-LLM WebSocket connected for call: %s", call_id)

    # 1. Send initial configuration to Retell
    await websocket.send_json({
        "response_type": "config",
        "config": {
            "auto_reconnect": True,
            "call_details": True
        }
    })

    # 2. Send initial neutral greeting
    await websocket.send_json({
        "response_type": "response",
        "response_id": 0,
        "content": "Hello? Haan ji, boliye, kaun bol rahe hain?",
        "content_complete": True
    })

    try:
        async for raw_message in websocket.iter_text():
            try:
                msg = json.loads(raw_message)
            except Exception:
                continue

            itype = msg.get("interaction_type")

            # Ping-Pong keepalive
            if itype == "ping_pong":
                await websocket.send_json({
                    "response_type": "ping_pong",
                    "timestamp": msg.get("timestamp")
                })

            elif itype == "call_details":
                call_info = msg.get("call", {})
                create_or_init_call(
                    call_id,
                    channel="phone",
                    from_num=call_info.get("from_number", ""),
                    to_num=call_info.get("to_number", "")
                )

            elif itype in ("response_required", "reminder_required"):
                response_id = msg.get("response_id", 1)
                transcript_turns = [
                    {
                        "role": "caller" if t.get("role") in ("user", "caller") else "agent",
                        "text": t.get("content", "")
                    }
                    for t in msg.get("transcript", [])
                ]

                # Step through multi-agent LangGraph engine
                out = await step(call_id, transcript_turns)
                reply_text = out.get("reply", "Haan ji, main sun raha hoon.")

                # Stream response back to Retell audio synthesizer
                await websocket.send_json({
                    "response_type": "response",
                    "response_id": response_id,
                    "content": reply_text,
                    "content_complete": True
                })

    except WebSocketDisconnect:
        logger.info("Retell WebSocket disconnected for call: %s", call_id)
    except Exception as e:
        logger.error("Retell WebSocket error: %s", e)

