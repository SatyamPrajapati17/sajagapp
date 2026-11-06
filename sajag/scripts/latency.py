"""
Sajag AI — Script 3: Latency Benchmark Script.
Executes 20 realistic turns and measures exact p50 & p95 turn latencies.
"""

import os
import sys
import time
import statistics

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from graph import graph

SAMPLE_UTTERANCES = [
    "Hello who is speaking?",
    "I am calling from CBI headquarters regarding a cyber complaint.",
    "Your mobile number is involved in an international narcotics shipment.",
    "Do you recognize the name Vikram Malhotra from Mumbai?",
    "The courier parcel seized at IGI Airport has your passport copy.",
    "Supreme Court has issued a summons under section 420.",
    "You have to stay on this line, do not talk to your family.",
    "We are sending our local police unit to your home address.",
    "If you want to clear your name you must cooperate with our verification.",
    "We need to audit your bank account balance right now.",
    "What is your account number and bank name?",
    "You have to transfer 15000 rupees to the judicial escrow account.",
    "The UPI address for court deposit is verify.cbi@sbi.",
    "Why are you taking so much time? Open your Google Pay or PhonePe.",
    "Tell me the reference transaction number once sent.",
    "Did you receive any verification OTP on your phone?",
    "Do not disconnect the call or arrest warrant will be executed immediately.",
    "Send the screenshot of payment confirmation.",
    "Are you an AI or automated system?",
    "Sir I am waiting, confirm the transfer immediately."
]

def benchmark_latency():
    print(f"[*] Starting 20-Turn Latency Benchmark...")
    latencies_ms = []

    state = {
        "call_id": "latency-bench-01",
        "mode": "MONITOR",
        "p_scam": 0.0,
        "turns": []
    }

    for i, utterance in enumerate(SAMPLE_UTTERANCES, 1):
        state["turns"].append({"role": "caller", "text": utterance})
        
        t0 = time.perf_counter()
        out = graph.invoke(state)
        t1 = time.perf_counter()

        elapsed_ms = (t1 - t0) * 1000
        latencies_ms.append(elapsed_ms)

        state.update(out)
        state["turns"].append({"role": "agent", "text": out.get("reply", "")})

        print(f"Turn {i:02d}: {elapsed_ms:6.2f} ms | Score: {out.get('p_scam'):.2f} | Mode: {out.get('mode')}")

    latencies_ms.sort()
    p50 = statistics.median(latencies_ms)
    p95 = latencies_ms[int(len(latencies_ms) * 0.95)]
    mean_lat = statistics.mean(latencies_ms)

    print("\n" + "=" * 45)
    print("SAJAG AI — MEASURED LATENCY BENCHMARK RESULTS")
    print("=" * 45)
    print(f"Total Turns Evaluated: {len(latencies_ms)}")
    print(f"Mean Latency:          {mean_lat:.2f} ms")
    print(f"Median (p50) Latency:  {p50:.2f} ms")
    print(f"95th Percentile (p95): {p95:.2f} ms")
    print(f"Min Latency:           {min(latencies_ms):.2f} ms")
    print(f"Max Latency:           {max(latencies_ms):.2f} ms")
    print("=" * 45)

    return {"p50": p50, "p95": p95, "mean": mean_lat}

if __name__ == "__main__":
    benchmark_latency()

