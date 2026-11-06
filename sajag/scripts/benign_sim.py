"""
Sajag AI — Script 2: Benign Calls Simulation.
Asserts:
1. Normal bank balance and local police verification calls stay LOW risk.
2. Mode NEVER leaves MONITORING.
3. No takeover event is ever triggered.
"""

import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from graph import graph

def run_benign_simulation():
    call_id = f"benign-sim-{int(time.time())}"
    print(f"[*] Starting Benign Calls simulation: {call_id}")

    benign_conversations = [
        # Scenario 1: Bank Balance Enquiry
        [
            "Namaste Sharma ji, this is State Bank automated balance alert.",
            "Your savings account balance ending in 4102 is 24,500 rupees.",
            "No action is required from your side. Have a pleasant day."
        ],
        # Scenario 2: Local Police Community Outreach
        [
            "Namaste uncle ji, local police station se Head Constable Patil bol raha hoon.",
            "Senior citizen security verification drive chal rahi hai hamare ward mein.",
            "Kal subah 11 baje hamare beat officer aayenge verification form bharne ke liye."
        ]
    ]

    for scenario_idx, script in enumerate(benign_conversations, 1):
        print(f"\n--- Testing Benign Scenario {scenario_idx} ---")
        conversation = []
        state = {
            "call_id": f"{call_id}-{scenario_idx}",
            "mode": "MONITOR",
            "p_scam": 0.0,
            "turns": []
        }

        for turn_text in script:
            conversation.append({"role": "caller", "text": turn_text})
            state["turns"] = conversation

            out = graph.invoke(state)
            state.update(out)

            print(f"[Caller]: {turn_text}")
            print(f"--> Score: p_scam={out.get('p_scam')} | Mode={out.get('mode')} | Level={out.get('level')}")

            # PRD Assertion: Benign calls must NEVER trigger PENDING or DECOY
            assert out.get("mode") == "MONITOR", f"False positive! Mode became {out.get('mode')}"
            assert out.get("p_scam") < 0.45, f"Risk score too high for benign call: {out.get('p_scam')}"
            assert "takeover_pending" not in out.get("events", [])
            assert "takeover_started" not in out.get("events", [])

    print("\n[SUCCESS] Benign Calls Simulation Passed: Zero False Positives!")


if __name__ == "__main__":
    run_benign_simulation()

