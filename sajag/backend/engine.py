"""
Sajag AI — Core Execution Engine.
Manages in-memory call states, steps through the LangGraph multi-agent state machine,
dispatches asynchronous events to n8n, and triggers anti-hallucination entity extraction.
"""

import asyncio
import logging
from typing import Dict, Any, List
from graph import graph
from store import (
    create_or_init_call,
    update_call,
    save_risk,
    emit
)
from extract import run_extraction

logger = logging.getLogger("sajag.engine")

# Active state cache: call_id -> LangGraph state dict
CALL_STATES: Dict[str, Dict[str, Any]] = {}


async def step(call_id: str, text_turns: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Core turn execution function shared by text simulator, web calls, Retell audio, and Twilio calls.
    1. Synchronizes in-memory and persisted call state.
    2. Runs LangGraph state machine: Guardian -> Safety Gate -> Decoy -> Output Filter.
    3. Persists risk events, updates metrics, and dispatches real-time n8n events.
    4. Kicks off verbatim anti-hallucination extraction in background.
    """
    create_or_init_call(call_id)
    state = CALL_STATES.setdefault(call_id, {
        "call_id": call_id,
        "mode": "MONITOR",
        "p_scam": 0.0,
        "turns": [],
        "signals": [],
        "low_streak": 0,
        "safety_blocks": 0
    })

    state["turns"] = text_turns

    # Execute LangGraph in async thread
    out = await asyncio.to_thread(graph.invoke, state)
    CALL_STATES[call_id] = out

    # Persist state updates to store
    await asyncio.to_thread(update_call, call_id, out)

    # Save risk event
    await asyncio.to_thread(
        save_risk,
        call_id=call_id,
        turn_seq=len(text_turns),
        p_scam=out.get("p_scam", 0.0),
        level=out.get("level", "LOW"),
        category=out.get("category", "BENIGN"),
        signals=out.get("signals", [])
    )

    # Dispatch events asynchronously to n8n
    for event in out.get("events", []):
        asyncio.create_task(emit(event, call_id, out))

    # Run extraction asynchronously in background outside the voice critical path
    asyncio.create_task(run_extraction(call_id, text_turns))

    return out

