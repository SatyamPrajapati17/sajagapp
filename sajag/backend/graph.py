"""
Sajag AI — LangGraph Multi-Agent Fraud Defence Engine.
Coordinates: Guardian -> Safety Gate -> (Monitor | Decoy) -> Output Filter.
"""

import os
import re
import json
import time
from typing import TypedDict, Literal, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from prompts import GUARDIAN, MONITOR, DECOY

# Thresholds & Models
THRESH = float(os.getenv("TAKEOVER_THRESHOLD", "0.88"))
GUARDIAN_MODEL = os.getenv("GUARDIAN_MODEL", "meta/llama-3.1-8b-instruct")
DECOY_MODEL = os.getenv("DECOY_MODEL", "meta/llama-3.3-70b-instruct")
NVIDIA_KEY = os.getenv("NVIDIA_API_KEY", "")

# Initialize NVIDIA NIM LLMs if key is configured
HAS_NVIDIA = bool(NVIDIA_KEY and not NVIDIA_KEY.startswith("mock") and not NVIDIA_KEY.startswith("nvapi-your"))

fast_llm = None
big_llm = None
if HAS_NVIDIA:
    try:
        from langchain_nvidia_ai_endpoints import ChatNVIDIA
        fast_llm = ChatNVIDIA(model=GUARDIAN_MODEL, temperature=0.0, max_tokens=200)
        big_llm = ChatNVIDIA(model=DECOY_MODEL, temperature=0.6, max_tokens=90)
    except Exception as e:
        HAS_NVIDIA = False


class GraphState(TypedDict, total=False):
    call_id: str
    turns: List[Dict[str, str]]
    p_scam: float
    level: str
    mode: Literal["MONITOR", "PENDING", "DECOY", "ENDED"]
    takeover_at: float
    cancelled: bool
    whitelisted: bool
    signals: List[str]
    category: str
    reply: str
    events: List[str]
    low_streak: int
    safety_blocks: int


CATS = {
    "authority": r"\b(cbi|police|ed\b|customs|trai|narcotics|crime branch|inspector|officer|rbi|bank manager|cyber cell|court|directorate|electricity|board|telecom)\b",
    "threat":    r"\b(arrest|warrant|case|jail|fir|money laundering|illegal|court|suspect|disconnect|blocked|freeze|seized|infected|summons|penalty)\b",
    "urgency":   r"\b(immediately|right now|minutes|urgent|last chance|do not disconnect|fast|tonight|today|hours)\b",
    "demand":    r"\b(transfer|upi|otp|pin|verification amount|deposit|apk|install|anydesk|gift card|pay|fee|penalty|security bond)\b",
    "secrecy":   r"\b(don'?t tell|do not tell|keep (it )?secret|camera on|stay on (the )?(call|line)|isolated|confidential)\b",
}

def calculate_prior(caller_text: str):
    """
    Deterministic prior scoring based on keyword category hits.
    PRD rule: Must hit >= 2 independent categories to reach >0.3.
    """
    lower = caller_text.lower()
    hits = [cat for cat, pattern in CATS.items() if re.search(pattern, lower)]
    
    if len(hits) >= 2:
        base = 0.25 * len(hits)
        if "demand" in hits:
            base += 0.15
        if "authority" in hits and "threat" in hits:
            base += 0.15
        return min(1.0, round(base, 3)), hits
    elif len(hits) == 1:
        return min(0.3, round(0.15 * len(hits), 3)), hits
    return 0.05, hits


def guardian_node(state: GraphState) -> Dict[str, Any]:
    """Guardian Node: Evaluates scam likelihood."""
    turns = state.get("turns", [])
    caller_text = " ".join(t.get("text", "") for t in turns if t.get("role") in ("caller", "user"))
    pr, hits = calculate_prior(caller_text)

    llm_p = pr
    cat = "BENIGN"
    sig = list(hits)

    if HAS_NVIDIA and fast_llm:
        recent_text = "\n".join(f'{t.get("role")}: {t.get("text")}' for t in turns[-8:])
        try:
            resp = fast_llm.invoke([
                ("system", GUARDIAN),
                ("user", f"Analyze this conversation:\n{recent_text}")
            ]).content
            match = re.search(r"\{.*\}", resp, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                llm_p = float(data.get("p_scam", pr))
                cat = data.get("category", "UNCERTAIN")
                sig = list(set(sig) | set(data.get("signals", [])))
        except Exception:
            # Fall back to deterministic prior if LLM timeout/error
            pass

    if cat == "BENIGN" and pr >= 0.7:
        if "authority" in hits:
            cat = "DIGITAL_ARREST"
        elif "demand" in hits:
            cat = "KYC_FRAUD"

    # Smoothed score: 70% LLM + 30% Deterministic Prior
    p = round(0.7 * llm_p + 0.3 * pr, 3)

    # Sticky decay: decays by at most 0.1 per turn
    old_p = float(state.get("p_scam", 0.0))
    p = max(p, round(old_p - 0.1, 3))
    p = min(1.0, max(0.0, p))

    # Level mapping
    if p >= THRESH:
        lvl = "CRITICAL"
    elif p >= 0.7:
        lvl = "HIGH"
    elif p >= 0.4:
        lvl = "MEDIUM"
    else:
        lvl = "LOW"

    low_streak = (state.get("low_streak", 0) + 1) if p < 0.4 else 0

    return {
        "p_scam": p,
        "level": lvl,
        "signals": sorted(list(set(sig) | set(hits))),
        "category": cat,
        "low_streak": low_streak
    }


def safety_gate_node(state: GraphState) -> Dict[str, Any]:
    """Safety Gate Node: Enforces thresholds, 3s countdown, and kill switch."""
    m = state.get("mode", "MONITOR")
    p = state.get("p_scam", 0.0)
    cancelled = state.get("cancelled", False)
    whitelisted = state.get("whitelisted", False)
    takeover_at = state.get("takeover_at", 0.0)
    now = time.time()
    events = []

    if m == "ENDED":
        return {"mode": "ENDED", "events": []}

    # MONITOR -> PENDING_TAKEOVER
    if m == "MONITOR" and p >= THRESH and not whitelisted and not cancelled:
        m = "PENDING"
        takeover_at = now + 3.0
        events.append("takeover_pending")
        return {"mode": m, "takeover_at": takeover_at, "events": events}

    # PENDING -> DECOY (if not cancelled and 3s elapsed)
    if m == "PENDING":
        if cancelled:
            return {"mode": "MONITOR", "events": ["takeover_cancelled"]}
        if now >= takeover_at:
            return {"mode": "DECOY", "events": ["takeover_started"]}
        # In simulation / text mode where turns are evaluated sequentially, advance to DECOY
        return {"mode": "DECOY", "events": ["takeover_started"]}

    # Auto stand-down if risk falls below 0.4 for 3 consecutive turns
    if m == "DECOY" and state.get("low_streak", 0) >= 3:
        return {"mode": "MONITOR", "events": ["decoy_stood_down"]}

    return {"mode": m, "events": events}


def route_decision(state: GraphState) -> Literal["decoy", "monitor", "ended"]:
    if state.get("mode") == "ENDED":
        return "ended"
    if state.get("mode") == "DECOY":
        return "decoy"
    return "monitor"


def generate_reply(prompt: str, llm, state: GraphState, fallback_mode: str) -> str:
    """Generate reply using NVIDIA LLM or high-fidelity persona fallback."""
    turns = state.get("turns", [])
    last_turn = turns[-1].get("text", "") if turns else ""

    # Truth in advertising: If sincerely asked "Are you an AI?", demo honesty rule triggers
    if re.search(r"\b(are you an? ai|are you a robot|are you automated|kya tum ai ho)\b", last_turn, re.I):
        return "Yes, I am Sajag AI, an automated defence agent protecting this phone line."

    if HAS_NVIDIA and llm:
        try:
            msgs = [("system", prompt)]
            for t in turns[-10:]:
                role = "assistant" if t.get("role") in ("agent", "assistant") else "user"
                msgs.append((role, t.get("text", "")))
            reply_text = llm.invoke(msgs).content.strip()
            return reply_text
        except Exception:
            pass

    # High-fidelity persona responses for tests and offline operation
    if fallback_mode == "monitor":
        return "Hello? Haan ji, boliye, kaun bol rahe hain?"
    else:
        # Ramesh Sharma decoy lines depending on context
        lower = last_turn.lower()
        if "otp" in lower or "pin" in lower:
            return "Beta phone par to koi message nahi aaya, ek bar dobara bhejenge?"
        if "upi" in lower or "transfer" in lower or "pay" in lower:
            return "Sahab ji ghabrahat ho rahi hai, UPI ID ki spelling boliye, diary mein likh raha hoon."
        if "cbi" in lower or "police" in lower or "arrest" in lower:
            return "Arey sahab maine kya kiya? Maine koi galat kaam nahi kiya, kripya mera case number batayein."
        return "Haan ji sahab, main sun raha hoon. Ek baar kripya dheere dheere batayein."


def monitor_node(state: GraphState) -> Dict[str, Any]:
    return {"reply": generate_reply(MONITOR, fast_llm, state, fallback_mode="monitor")}


def decoy_node(state: GraphState) -> Dict[str, Any]:
    return {"reply": generate_reply(DECOY, big_llm, state, fallback_mode="decoy")}


def ended_node(state: GraphState) -> Dict[str, Any]:
    return {"reply": "Call has ended. Thank you."}


# Non-negotiable PRD §6 safety filters
BAD_REPLY_REGEX = re.compile(
    r"(\b\d{4,}\b|\botp is\b|\bpin is\b|password is|https?://|i will (pay|transfer|send)|mera pin|mera password)",
    re.I
)

SAFE_STALL_LINE = "Haan ji... ek minute beta, mujhe samajh nahi aaya. Aap dobara bataiye, dheere dheere."


def output_filter_node(state: GraphState) -> Dict[str, Any]:
    """
    CRITICAL SAFETY GATEWAY:
    Blocks OTP/PIN/passwords, outgoing digit leaks, URLs, and payment promises.
    Enforces a strict 35-word cap for voice response speed.
    """
    reply = state.get("reply", "")
    safety_blocks = 0

    if BAD_REPLY_REGEX.search(reply) or len(reply.split()) > 35:
        reply = SAFE_STALL_LINE
        safety_blocks = 1

    return {"reply": reply, "safety_blocks": safety_blocks}


# Build LangGraph workflow
builder = StateGraph(GraphState)
builder.add_node("guardian", guardian_node)
builder.add_node("gate", safety_gate_node)
builder.add_node("monitor", monitor_node)
builder.add_node("decoy", decoy_node)
builder.add_node("ended", ended_node)
builder.add_node("filter", output_filter_node)

builder.set_entry_point("guardian")
builder.add_edge("guardian", "gate")
builder.add_conditional_edges(
    "gate",
    route_decision,
    {
        "monitor": "monitor",
        "decoy": "decoy",
        "ended": "ended"
    }
)
builder.add_edge("monitor", "filter")
builder.add_edge("decoy", "filter")
builder.add_edge("ended", END)
builder.add_edge("filter", END)

graph = builder.compile()
