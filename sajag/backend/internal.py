"""
Sajag AI — Internal Secret-Guarded Routes for n8n Automation Engine.
Implements BACKEND_MODULES.md §4.
All endpoints are protected by the X-Sajag-Secret header.
"""

import os
import time
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from store import (
    MEM,
    get_call,
    get_identifiers_for_call,
    get_cross_incident_overlap,
    update_call_meta,
    audit,
    emit
)
from reports import generate_report_payload

logger = logging.getLogger("sajag.internal")
internal_router = APIRouter(prefix="/internal", tags=["Internal n8n Automation"])

INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", os.getenv("N8N_SECRET", "sajag-secret-key-change-me"))


async def require_internal_secret(x_sajag_secret: Optional[str] = Header(None)):
    """Verifies the X-Sajag-Secret authentication header."""
    if not x_sajag_secret or x_sajag_secret != INTERNAL_SECRET:
        logger.warning("Rejected internal API request: missing or invalid X-Sajag-Secret")
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid X-Sajag-Secret header")
    return True


# --- Request Models ---

class ReportGenRequest(BaseModel):
    call_id: str

class TwilioMetaUpdateRequest(BaseModel):
    call_id: str
    twilio_meta: Optional[Dict[str, Any]] = None
    lookup_meta: Optional[Dict[str, Any]] = None

class AuditLogRequest(BaseModel):
    actor: Optional[str] = "n8n_workflow"
    action: str
    entity: str
    entity_id: Optional[str] = ""
    meta: Optional[Dict[str, Any]] = None


# --- Endpoints ---

@internal_router.post("/reports/generate", dependencies=[Depends(require_internal_secret)])
async def internal_generate_report(req: ReportGenRequest):
    """
    Triggered by n8n when a scam call concludes to compile the initial draft report.
    """
    call_id = req.call_id
    call = get_call(call_id) or {"id": call_id, "state": "ENDED"}
    turns = MEM.transcript_turns.get(call_id, [])
    identifiers = get_identifiers_for_call(call_id)

    payload = generate_report_payload(call, turns, identifiers)
    report_id = payload["report_id"]

    MEM.reports[call_id] = {
        "id": report_id,
        "call_id": call_id,
        "status": "draft",
        "payload": payload,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    await emit("report_ready", call_id, {"report_id": report_id})
    audit("n8n", "generate_report_draft", "reports", report_id)

    return {
        "status": "ok",
        "report_id": report_id,
        "call_id": call_id,
        "draft_report": payload
    }


@internal_router.get("/overlap", dependencies=[Depends(require_internal_secret)])
async def internal_check_overlap(handle: Optional[str] = None):
    """
    Checks if an extracted handle (UPI, phone, account) has been observed across multiple calls.
    Used by n8n to correlate emerging scam syndicate campaigns.
    """
    overlaps = get_cross_incident_overlap()
    if handle:
        handle_norm = handle.strip().lower()
        matched = [o for o in overlaps if o["handle"].lower() == handle_norm]
        return {
            "handle": handle,
            "has_overlap": len(matched) > 0,
            "overlap_details": matched[0] if matched else None
        }

    return {"overlaps": overlaps, "count": len(overlaps)}


@internal_router.post("/twilio-meta", dependencies=[Depends(require_internal_secret)])
async def internal_update_twilio_meta(req: TwilioMetaUpdateRequest):
    """
    Enables n8n to ingest enriched carrier and Twilio Lookup v2 metadata into the call record.
    """
    call_id = req.call_id
    update_call_meta(call_id, twilio_meta=req.twilio_meta, lookup_meta=req.lookup_meta)
    audit("n8n", "update_twilio_meta", "calls", call_id, {
        "has_twilio_meta": bool(req.twilio_meta),
        "has_lookup_meta": bool(req.lookup_meta)
    })
    return {"status": "updated", "call_id": call_id}


@internal_router.post("/audit", dependencies=[Depends(require_internal_secret)])
async def internal_audit_event(req: AuditLogRequest):
    """
    Logs workflow execution events, node retries, or alerts into the tamper-evident audit log.
    """
    audit(
        actor=req.actor or "n8n",
        action=req.action,
        entity=req.entity,
        entity_id=req.entity_id or "",
        meta=req.meta
    )
    return {"status": "audited", "action": req.action}

