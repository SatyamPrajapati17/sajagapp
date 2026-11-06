"""
Sajag AI — Intelligence Extraction, Validation, and Traceability Engine.
Runs asynchronously outside the critical live voice response path.
"""

import os
import re
import json
import hashlib
import logging
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from prompts import EXTRACTOR
from store import upsert_identifier, update_call

logger = logging.getLogger("sajag.extract")

# Deterministic Syntax Validators (per TRD §6)
VALIDATORS = {
    "phone": re.compile(r"^(?:\+91|0)?[6-9]\d{9}$"),
    "upi": re.compile(r"^[\w.\-]{2,256}@[a-zA-Z]{2,64}$"),
    "ifsc": re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$"),
    "bank_account": re.compile(r"^\d{9,18}$"),
    "email": re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"),
}

def validate_syntax(id_type: str, normalized_val: str) -> bool:
    """Validate syntax without claiming ownership verification."""
    if id_type in VALIDATORS:
        return bool(VALIDATORS[id_type].match(normalized_val))
    if id_type == "url":
        try:
            res = urlparse(normalized_val if "://" in normalized_val else f"http://{normalized_val}")
            return bool(res.netloc)
        except Exception:
            return False
    # Name, org, case_no are text claims
    if id_type in ("name_claimed", "org_claimed", "case_no"):
        return len(normalized_val.strip()) >= 3
    return False


def normalize_value(id_type: str, val: str) -> str:
    """Normalize extracted values for consistent cross-call deduplication."""
    val = val.strip()
    if id_type == "phone":
        clean = re.sub(r"[^\d+]", "", val)
        if clean.startswith("+91") and len(clean) == 13:
            return clean
        if clean.startswith("0") and len(clean) == 11:
            return "+91" + clean[1:]
        if len(clean) == 10:
            return "+91" + clean
        return clean
    elif id_type == "upi":
        return val.lower()
    elif id_type == "ifsc":
        return val.upper()
    elif id_type == "bank_account":
        return re.sub(r"\D", "", val)
    elif id_type == "email":
        return val.lower()
    return val


def is_traceable(candidate_val: str, caller_transcript: str) -> bool:
    """
    CRITICAL ANTI-HALLUCINATION GUARDRAIL:
    The alphanumeric content of the extracted identifier must appear verbatim
    in the raw caller transcript text.
    """
    clean_val = re.sub(r"[\s\-+@.]", "", candidate_val.lower())
    clean_transcript = re.sub(r"[\s\-+@.]", "", caller_transcript.lower())
    return clean_val in clean_transcript


def deterministic_fallback_extractor(caller_text: str) -> List[Dict[str, str]]:
    """
    Reliable regex-based fallback extractor for tests and offline operation.
    """
    candidates = []
    
    # UPI regex: e.g., police.verify@sbi or scammer@ybl
    for m in re.finditer(r"\b([a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32})\b", caller_text):
        candidates.append({"type": "upi", "value": m.group(1), "quote": m.group(0)})

    # Indian Phone regex: e.g., +919876543210, 9876543210
    for m in re.finditer(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b", caller_text):
        candidates.append({"type": "phone", "value": m.group(0), "quote": m.group(0)})

    # IFSC regex: e.g., SBIN0001234
    for m in re.finditer(r"\b([A-Z]{4}0[A-Z0-9]{6})\b", caller_text.upper()):
        candidates.append({"type": "ifsc", "value": m.group(1), "quote": m.group(0)})

    # Bank account regex: 11-16 digits
    for m in re.finditer(r"\b(\d{11,16})\b", caller_text):
        # Don't treat 10-digit phone as bank account
        candidates.append({"type": "bank_account", "value": m.group(1), "quote": m.group(0)})

    # Case / FIR numbers
    for m in re.finditer(r"\b((?:FIR|CBI|CASE)[\w\/\-]{4,20})\b", caller_text, re.I):
        candidates.append({"type": "case_no", "value": m.group(1), "quote": m.group(0)})

    # Claimed authorities
    if re.search(r"\b(cbi|central bureau of investigation)\b", caller_text, re.I):
        candidates.append({"type": "org_claimed", "value": "CBI", "quote": "CBI"})
    if re.search(r"\b(mumbai police|delhi police|cyber cell)\b", caller_text, re.I):
        candidates.append({"type": "org_claimed", "value": "Police Cyber Cell", "quote": "Cyber Cell"})

    return candidates


def compute_script_fingerprint(signals: List[str], org_claimed: str) -> str:
    """Compute deterministic SHA-1 campaign fingerprint."""
    payload = f"{sorted(signals)}:{org_claimed.lower().strip()}"
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:12]


async def run_extraction(call_id: str, text_turns: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Extracts identifiers from caller lines ONLY.
    Runs anti-hallucination check, deterministic syntax validation, and records to store.
    """
    # Filter ONLY caller lines (Rule: NEVER extract agent-spoken persona data)
    caller_turns = [t for t in text_turns if t.get("role") in ("caller", "user")]
    if not caller_turns:
        return []

    caller_transcript = " ".join(t.get("text", "") for t in caller_turns)
    extracted_candidates: List[Dict[str, str]] = []

    # Attempt LLM extraction if NVIDIA key is valid
    nvidia_key = os.getenv("NVIDIA_API_KEY", "")
    if nvidia_key and not nvidia_key.startswith("mock") and not nvidia_key.startswith("nvapi-your"):
        try:
            from langchain_nvidia_ai_endpoints import ChatNVIDIA
            extractor_llm = ChatNVIDIA(
                model=os.getenv("GUARDIAN_MODEL", "meta/llama-3.1-8b-instruct"),
                temperature=0.0,
                max_tokens=250
            )
            raw = extractor_llm.invoke([
                ("system", EXTRACTOR),
                ("user", f"Caller transcript:\n{caller_transcript}")
            ]).content
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                extracted_candidates = data.get("entities", [])
        except Exception as e:
            logger.warning("LLM extraction failed, using deterministic fallback: %s", e)

    # Fallback to deterministic regex extractor
    if not extracted_candidates:
        extracted_candidates = deterministic_fallback_extractor(caller_transcript)

    saved_records = []
    org_claimed = "Unknown"

    for cand in extracted_candidates:
        id_type = cand.get("type", "")
        raw_val = str(cand.get("value", "")).strip()
        quote = cand.get("quote", raw_val)

        if not raw_val or not id_type:
            continue

        # Traceability check: Must be grounded in caller's transcript
        if not is_traceable(raw_val, caller_transcript):
            logger.info("Anti-hallucination dropped untraceable candidate: %s (%s)", raw_val, id_type)
            continue

        norm_val = normalize_value(id_type, raw_val)
        valid = validate_syntax(id_type, norm_val)

        if id_type == "org_claimed":
            org_claimed = norm_val

        rec = upsert_identifier(
            call_id=call_id,
            turn_seq=len(text_turns),
            id_type=id_type,
            value=raw_val,
            normalized=norm_val,
            syntax_valid=valid,
            quote=quote,
            confidence=1.0 if valid else 0.5,
            source="caller_stated"
        )
        saved_records.append(rec)

    # Update script campaign fingerprint
    signals = [rec["type"] for rec in saved_records]
    if signals or org_claimed != "Unknown":
        fp = compute_script_fingerprint(signals, org_claimed)
        update_call(call_id, {"script_fp": fp})

    return saved_records

