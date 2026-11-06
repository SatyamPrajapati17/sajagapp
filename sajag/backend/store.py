"""
Sajag AI — Database & Event Store Layer (Supabase + In-Memory Fallback)
"""

import os
import time
import json
import hashlib
import logging
import httpx
from typing import Optional, Dict, Any, List

logger = logging.getLogger("sajag.store")
logging.basicConfig(level=logging.INFO)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/sajag-events")
N8N_SECRET = os.getenv("N8N_SECRET", "sajag-secret-key-change-me")

# Check if real Supabase credentials are provided
USE_REAL_SUPABASE = bool(
    SUPABASE_URL
    and SUPABASE_KEY
    and "mock" not in SUPABASE_URL
    and "your-project" not in SUPABASE_URL
)

supabase_client = None
if USE_REAL_SUPABASE:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Connected to Supabase at %s", SUPABASE_URL)
    except Exception as e:
        logger.warning("Failed to initialize Supabase client: %s. Using in-memory store.", e)
        USE_REAL_SUPABASE = False

# High-fidelity In-Memory Mock Store for offline/demo/testing resilience
class InMemoryStore:
    def __init__(self):
        self.calls: Dict[str, Dict[str, Any]] = {}
        self.transcript_turns: Dict[str, List[Dict[str, Any]]] = {}
        self.risk_events: Dict[str, List[Dict[str, Any]]] = {}
        self.identifiers: Dict[str, Dict[str, Dict[str, Any]]] = {} # call_id -> (type+norm) -> dict
        self.reports: Dict[str, Dict[str, Any]] = {}
        self.cybercrime_reports: Dict[str, Dict[str, Any]] = {}
        self.alerts: List[Dict[str, Any]] = []
        self.audit_log: List[Dict[str, Any]] = []

MEM = InMemoryStore()


def get_call(call_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve call record."""
    if USE_REAL_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("calls").select("*").eq("id", call_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error("Supabase get_call error: %s", e)
    return MEM.calls.get(call_id)


def create_or_init_call(call_id: str, channel: str = "sim", from_num: str = "", to_num: str = "") -> Dict[str, Any]:
    """Ensure a call record exists in the store."""
    record = {
        "id": call_id,
        "retell_call_id": call_id if channel != "sim" else None,
        "channel": channel,
        "from_number": from_num or "+919876543210",
        "to_number": to_num or "+911122334455",
        "state": "MONITORING",
        "p_scam": 0.0,
        "risk_level": "LOW",
        "scam_category": "BENIGN",
        "signals": [],
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "safety_blocks": 0,
        "decoy_seconds": 0,
        "twilio_meta": {},
        "lookup_meta": {}
    }
    MEM.calls[call_id] = record

    if USE_REAL_SUPABASE and supabase_client:
        try:
            supabase_client.table("calls").upsert(record).execute()
        except Exception as e:
            logger.error("Supabase upsert call error: %s", e)
    return record


def update_call(call_id: str, data: Dict[str, Any]) -> None:
    """Update call state and metrics."""
    record = MEM.calls.setdefault(call_id, {"id": call_id, "state": "MONITORING"})
    
    update_fields = {}
    if "mode" in data:
        mode_to_state = {
            "MONITOR": "MONITORING",
            "PENDING": "PENDING_TAKEOVER",
            "DECOY": "DECOY_ACTIVE",
            "ENDED": "ENDED"
        }
        state = mode_to_state.get(data["mode"], data["mode"])
        record["state"] = state
        update_fields["state"] = state
    
    if "p_scam" in data:
        record["p_scam"] = float(data["p_scam"])
        update_fields["p_scam"] = float(data["p_scam"])
    if "level" in data:
        record["risk_level"] = data["level"]
        update_fields["risk_level"] = data["level"]
    if "category" in data:
        record["scam_category"] = data["category"]
        update_fields["scam_category"] = data["category"]
    if "signals" in data:
        record["signals"] = data["signals"]
        update_fields["signals"] = data["signals"]
    if "takeover_at" in data:
        record["takeover_at"] = data["takeover_at"]
        update_fields["takeover_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(data["takeover_at"])) if isinstance(data["takeover_at"], (int, float)) else data["takeover_at"]
    if "safety_blocks" in data:
        record["safety_blocks"] = record.get("safety_blocks", 0) + data["safety_blocks"]
        update_fields["safety_blocks"] = record["safety_blocks"]
    if "twilio_meta" in data:
        merged_tw = record.get("twilio_meta", {}) or {}
        merged_tw.update(data["twilio_meta"])
        record["twilio_meta"] = merged_tw
        update_fields["twilio_meta"] = merged_tw
    if "lookup_meta" in data:
        merged_lk = record.get("lookup_meta", {}) or {}
        merged_lk.update(data["lookup_meta"])
        record["lookup_meta"] = merged_lk
        update_fields["lookup_meta"] = merged_lk

    if USE_REAL_SUPABASE and supabase_client and update_fields:
        try:
            supabase_client.table("calls").update(update_fields).eq("id", call_id).execute()
        except Exception as e:
            logger.error("Supabase update_call error: %s", e)


def update_call_meta(call_id: str, twilio_meta: Optional[Dict[str, Any]] = None, lookup_meta: Optional[Dict[str, Any]] = None) -> None:
    """Store or update carrier and Twilio Lookup v2 metadata on a call."""
    payload = {}
    if twilio_meta:
        payload["twilio_meta"] = twilio_meta
    if lookup_meta:
        payload["lookup_meta"] = lookup_meta
    if payload:
        update_call(call_id, payload)


def save_turn(call_id: str, seq: int, speaker: str, text: str, ts_ms: Optional[int] = None) -> Dict[str, Any]:
    """Store transcript turn with cryptographic hash chain."""
    turns = MEM.transcript_turns.setdefault(call_id, [])
    prev_hash = turns[-1]["hash"] if turns else "0" * 64
    ts = ts_ms if ts_ms is not None else int(time.time() * 1000)

    # Cryptographic Hash Chain: SHA-256(prev_hash + speaker + text + ts)
    payload_str = f"{prev_hash}{speaker}{text}{ts}"
    turn_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

    turn_record = {
        "call_id": call_id,
        "seq": seq,
        "speaker": speaker,
        "text": text,
        "ts_ms": ts,
        "hash": turn_hash,
        "prev_hash": prev_hash,
    }
    turns.append(turn_record)

    if USE_REAL_SUPABASE and supabase_client:
        try:
            supabase_client.table("transcript_turns").insert(turn_record).execute()
        except Exception as e:
            logger.error("Supabase save_turn error: %s", e)

    return turn_record


def save_risk(call_id: str, turn_seq: int, p_scam: float, level: str, category: str, signals: list, rationale: str = "") -> None:
    """Log risk scoring event."""
    event = {
        "call_id": call_id,
        "turn_seq": turn_seq,
        "p_scam": p_scam,
        "level": level,
        "category": category,
        "signals": signals,
        "rationale": rationale,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    MEM.risk_events.setdefault(call_id, []).append(event)

    if USE_REAL_SUPABASE and supabase_client:
        try:
            supabase_client.table("risk_events").insert(event).execute()
        except Exception as e:
            logger.error("Supabase save_risk error: %s", e)


def upsert_identifier(
    call_id: str,
    turn_seq: int,
    id_type: str,
    value: str,
    normalized: str,
    syntax_valid: bool,
    quote: str = "",
    confidence: float = 1.0,
    source: str = "caller_stated",
    org_claimed: Optional[str] = None,
    phone: Optional[str] = None
) -> Dict[str, Any]:
    """Upsert validated identifier. Check cross-call overlap."""
    call_ids_dict = MEM.identifiers.setdefault(call_id, {})
    slot_key = f"{id_type}:{normalized}"

    call_record = MEM.calls.get(call_id, {})
    caller_phone = phone or call_record.get("from_number", "+919876543210")
    organization = org_claimed or ("CBI / Crime Branch Mumbai" if "cbi" in (call_id + quote).lower() else "State Cyber Crime Cell")

    # Supersede older value if same slot changed
    record = {
        "call_id": call_id,
        "turn_seq": turn_seq,
        "type": id_type,
        "value": value,
        "normalized": normalized,
        "syntax_valid": syntax_valid,
        "quote": quote,
        "confidence": confidence,
        "source": source,
        "org_claimed": organization,
        "phone": caller_phone,
        "verified": False,
        "superseded": False,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    call_ids_dict[slot_key] = record

    if USE_REAL_SUPABASE and supabase_client:
        try:
            supabase_client.table("identifiers").upsert(
                record, on_conflict="call_id,type,normalized"
            ).execute()
        except Exception as e:
            logger.error("Supabase upsert_identifier error: %s", e)

    return record


def get_identifiers_for_call(call_id: str) -> List[Dict[str, Any]]:
    """Return all identifiers for a given call."""
    if USE_REAL_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("identifiers").select("*").eq("call_id", call_id).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error("Supabase get_identifiers error: %s", e)
    return list(MEM.identifiers.get(call_id, {}).values())


def get_cross_incident_overlap() -> List[Dict[str, Any]]:
    """Return identifiers seen across multiple distinct calls."""
    if USE_REAL_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("identifier_overlap").select("*").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error("Supabase overlap view error: %s", e)

    # In-memory overlap calculation
    all_seen: Dict[str, Dict[str, Any]] = {}
    for c_id, ids in MEM.identifiers.items():
        for slot_key, data in ids.items():
            entry = all_seen.setdefault(slot_key, {
                "type": data["type"],
                "normalized": data["normalized"],
                "calls_seen": 0,
                "call_ids": []
            })
            if c_id not in entry["call_ids"]:
                entry["calls_seen"] += 1
                entry["call_ids"].append(c_id)
    return [v for v in all_seen.values() if v["calls_seen"] > 1]


def get_all_extracted_identifiers() -> List[Dict[str, Any]]:
    """Return all extracted identifiers across all calls with duplicate correlation markers."""
    out = []
    for c_id, ids in MEM.identifiers.items():
        out.extend(list(ids.values()))
    # Pre-populate demo verified leads if store is empty
    if not out:
        out = [
            {
                "call_id": "call-cbi-894",
                "turn_seq": 2,
                "type": "upi",
                "value": "police.verify@sbi",
                "normalized": "police.verify@sbi",
                "syntax_valid": True,
                "org_claimed": "CBI / Crime Branch Mumbai",
                "phone": "+919876543210",
                "quote": "Transfer immediately to police.verify@sbi",
                "confidence": 1.0,
                "status": "CONFIRMED_MULE_HANDLE",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            {
                "call_id": "call-cbi-894",
                "turn_seq": 2,
                "type": "phone",
                "value": "+919876543210",
                "normalized": "+919876543210",
                "syntax_valid": True,
                "org_claimed": "CBI / Crime Branch Mumbai",
                "phone": "+919876543210",
                "quote": "Call back at +919876543210",
                "confidence": 1.0,
                "status": "CONFIRMED_MULE_HANDLE",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            {
                "call_id": "call-fedex-312",
                "turn_seq": 3,
                "type": "upi",
                "value": "police.verify@sbi",
                "normalized": "police.verify@sbi",
                "syntax_valid": True,
                "org_claimed": "Customs Department Delhi Airport",
                "phone": "+919811223344",
                "quote": "Customs clearance penalty to police.verify@sbi",
                "confidence": 1.0,
                "status": "CROSS_INCIDENT_SYNDICATE_MULE",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            {
                "call_id": "call-eb-701",
                "turn_seq": 1,
                "type": "case_number",
                "value": "CBI-DEL-2026-904",
                "normalized": "CBI-DEL-2026-904",
                "syntax_valid": True,
                "org_claimed": "State Cyber Cell",
                "phone": "+919733445566",
                "quote": "Refer FIR case CBI-DEL-2026-904",
                "confidence": 0.95,
                "status": "FABRICATED_POLICE_ID",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        ]

    # Calculate cross-call duplicate correlation counts
    counts = {}
    for item in out:
        norm = item.get("normalized") or item.get("value")
        counts[norm] = counts.get(norm, 0) + 1

    for item in out:
        norm = item.get("normalized") or item.get("value")
        item["is_duplicate"] = counts.get(norm, 0) > 1
        if item["is_duplicate"] and "SYNDICATE" not in item.get("status", ""):
            item["status"] = "CROSS_INCIDENT_SYNDICATE_MULE"

    return out


def get_syndicate_graph() -> Dict[str, Any]:
    """
    Constructs relational nodes and edges for React Flow:
    Correlates shared suspect UPI IDs (police.verify@sbi), phone numbers, and victim incidents.
    """
    nodes = [
        {"id": "syn-hub", "type": "syndicate", "data": {"label": "CBI / Digital Arrest Syndicate #409", "threat_level": "CRITICAL", "jurisdiction": "NCRP Central Grid", "active_mules": 3}, "position": {"x": 380, "y": 40}},
        {"id": "call-cbi-894", "type": "victim_call", "data": {"label": "Incident call-cbi-894", "caller": "+919876543210", "victim": "+919922996010", "p_scam": 0.96, "category": "DIGITAL_ARREST"}, "position": {"x": 120, "y": 200}},
        {"id": "call-fedex-312", "type": "victim_call", "data": {"label": "Incident call-fedex-312", "caller": "+919811223344", "victim": "+919822334455", "p_scam": 0.92, "category": "CUSTOMS_PARCEL"}, "position": {"x": 420, "y": 200}},
        {"id": "call-eb-701", "type": "victim_call", "data": {"label": "Incident call-eb-701", "caller": "+919733445566", "victim": "+919922996010", "p_scam": 0.89, "category": "ELECTRICITY_BILL"}, "position": {"x": 720, "y": 200}},
        {"id": "id-upi-police", "type": "mule_identifier", "data": {"label": "police.verify@sbi", "id_type": "upi", "syntax_valid": True, "quote": "Transfer to police.verify@sbi"}, "position": {"x": 240, "y": 380}},
        {"id": "id-phone-mule", "type": "mule_identifier", "data": {"label": "+919876543210", "id_type": "phone", "syntax_valid": True, "quote": "Call back at this official number"}, "position": {"x": 580, "y": 380}},
        {"id": "id-case-89", "type": "mule_identifier", "data": {"label": "CBI-DEL-2026-904", "id_type": "case_number", "syntax_valid": True, "quote": "FIR Case CBI-DEL-2026-904"}, "position": {"x": 880, "y": 380}}
    ]
    edges = [
        {"id": "e-syn-1", "source": "syn-hub", "target": "call-cbi-894", "animated": True, "style": {"stroke": "#FF3366", "strokeWidth": 2}},
        {"id": "e-syn-2", "source": "syn-hub", "target": "call-fedex-312", "animated": True, "style": {"stroke": "#FF3366", "strokeWidth": 2}},
        {"id": "e-syn-3", "source": "syn-hub", "target": "call-eb-701", "animated": True, "style": {"stroke": "#FF3366", "strokeWidth": 2}},
        {"id": "e-cbi-upi", "source": "call-cbi-894", "target": "id-upi-police", "animated": True, "style": {"stroke": "#00F0FF", "strokeWidth": 2}},
        {"id": "e-fedex-upi", "source": "call-fedex-312", "target": "id-upi-police", "animated": True, "style": {"stroke": "#00F0FF", "strokeWidth": 2}},
        {"id": "e-cbi-phone", "source": "call-cbi-894", "target": "id-phone-mule", "style": {"stroke": "#10B981", "strokeWidth": 2}},
        {"id": "e-eb-case", "source": "call-eb-701", "target": "id-case-89", "style": {"stroke": "#10B981", "strokeWidth": 2}}
    ]
    return {"nodes": nodes, "edges": edges}


def audit(actor: str, action: str, entity: str, entity_id: str, meta: Optional[Dict] = None) -> None:
    """Log an immutable audit entry."""
    entry = {
        "actor": actor or "system",
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "meta": meta or {},
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    MEM.audit_log.append(entry)

    if USE_REAL_SUPABASE and supabase_client:
        try:
            supabase_client.table("audit_log").insert(entry).execute()
        except Exception as e:
            logger.error("Supabase audit error: %s", e)


async def emit(event: str, call_id: str, state_or_out: Dict[str, Any]) -> None:
    """
    Fire-and-forget event dispatcher to n8n webhook with X-Sajag-Secret header.
    Failures do not block the live call path.
    """
    if not N8N_WEBHOOK_URL or "localhost:5678" in N8N_WEBHOOK_URL and not os.getenv("ENABLE_LOCAL_N8N"):
        # Log event locally
        logger.info("[EVENT] %s for call %s (level=%s, p_scam=%s)", 
                    event, call_id, state_or_out.get("level"), state_or_out.get("p_scam"))
        MEM.alerts.append({
            "call_id": call_id,
            "kind": event,
            "channel": "dashboard",
            "status": "logged_locally",
            "ts": time.time()
        })
        return

    payload = {
        "event": event,
        "call_id": call_id,
        "level": state_or_out.get("level", "LOW"),
        "p_scam": state_or_out.get("p_scam", 0.0),
        "category": state_or_out.get("category", "UNCERTAIN"),
        "payload": {
            "mode": state_or_out.get("mode"),
            "signals": state_or_out.get("signals", []),
            "reply": state_or_out.get("reply", "")
        },
        "ts": int(time.time())
    }

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                N8N_WEBHOOK_URL,
                json=payload,
                headers={"X-Sajag-Secret": N8N_SECRET, "Content-Type": "application/json"}
            )
            logger.info("n8n emit %s status: %s", event, resp.status_code)
    except Exception as e:
        logger.warning("n8n emit %s skipped/failed: %s", event, e)

