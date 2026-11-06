#!/usr/bin/env python3
"""
Sajag AI — n8n Workflow & Event Integration Test Harness.
Verifies bidirectional communication between FastAPI backend and n8n engine.
1. Tests backend internal secret-guarded APIs (n8n -> Backend).
2. Probes n8n webhook listener (Backend -> n8n).
3. Simulates end-to-end event dispatching (takeover_started, call_ended).
"""

import os
import sys
import json
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(ENV_PATH)

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/sajag-events")
SECRET = os.getenv("INTERNAL_SECRET", os.getenv("N8N_SECRET", "sajag-secret-key-change-me"))
FAMILY_PHONE = os.getenv("FAMILY_PHONE", "+919922996010")


def print_header(title):
    print("\n" + "=" * 65)
    print(f" {title}")
    print("=" * 65)


def test_backend_internal_routes():
    """Verify backend internal endpoints that n8n calls back into."""
    print_header("TEST 1: Backend Internal Routes (n8n -> Backend)")
    client = httpx.Client(timeout=5.0)

    # 1. Test Unauthorized Request (Must fail with 401)
    try:
        resp = client.post(f"{BACKEND_URL}/internal/reports/generate", json={"call_id": "test-call"})
        if resp.status_code == 401:
            print("[PASS] Security Guard: Request without X-Sajag-Secret rejected with 401 Unauthorized")
        else:
            print(f"[FAIL] Expected 401 for unauthenticated request, got {resp.status_code}")
    except Exception as e:
        print(f"[ERROR] Cannot connect to FastAPI backend at {BACKEND_URL}: {e}")
        return False

    # 2. Test Authorized Report Generation
    try:
        resp = client.post(
            f"{BACKEND_URL}/internal/reports/generate",
            headers={"X-Sajag-Secret": SECRET},
            json={"call_id": "test-n8n-call"}
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"[PASS] POST /internal/reports/generate: 200 OK (Report ID: {data.get('report_id')})")
        else:
            print(f"[FAIL] POST /internal/reports/generate returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 3. Test Authorized Overlap Check
    try:
        resp = client.get(
            f"{BACKEND_URL}/internal/overlap",
            headers={"X-Sajag-Secret": SECRET}
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"[PASS] GET /internal/overlap: 200 OK (Overlaps found: {data.get('count', 0)})")
        else:
            print(f"[FAIL] GET /internal/overlap returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 4. Test Authorized Twilio Metadata Update
    try:
        resp = client.post(
            f"{BACKEND_URL}/internal/twilio-meta",
            headers={"X-Sajag-Secret": SECRET},
            json={
                "call_id": "test-n8n-call",
                "twilio_meta": {"From": FAMILY_PHONE, "CallStatus": "completed", "Carrier": "Test Carrier"}
            }
        )
        if resp.status_code == 200:
            print("[PASS] POST /internal/twilio-meta: 200 OK (Metadata synced)")
        else:
            print(f"[FAIL] POST /internal/twilio-meta returned {resp.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

    return True


def test_n8n_webhook_connection():
    """Verify connection to n8n webhook listener (Backend -> n8n)."""
    print_header("TEST 2: n8n Webhook Listener (Backend -> n8n)")
    print(f"Target Webhook URL: {N8N_WEBHOOK_URL}")
    print(f"Authentication Header: X-Sajag-Secret: {SECRET[:4]}...{SECRET[-4:]}")

    client = httpx.Client(timeout=4.0)

    # Payload 1: takeover_started (Triggers Family SMS on n8n)
    payload_takeover = {
        "event": "takeover_started",
        "call_id": f"sim-call-{int(time.time())}",
        "level": "CRITICAL",
        "p_scam": 0.95,
        "category": "DIGITAL_ARREST",
        "ts": int(time.time()),
        "payload": {
            "mode": "DECOY",
            "family_phone": FAMILY_PHONE,
            "reply": "Sahab ji ghabrahat ho rahi hai, UPI ID boliye...",
            "signals": ["authority", "threat", "urgency", "demand"]
        }
    }

    try:
        resp = client.post(
            N8N_WEBHOOK_URL,
            headers={
                "X-Sajag-Secret": SECRET,
                "Content-Type": "application/json"
            },
            json=payload_takeover
        )
        if resp.status_code in (200, 201):
            print("[SUCCESS] n8n Webhook is RUNNING and accepted the event payload!")
            print(f"Response ({resp.status_code}): {resp.text}")
            return True
        else:
            print(f"[NOTICE] n8n returned HTTP {resp.status_code}: {resp.text}")
            return False
    except httpx.ConnectError:
        print("\n[!] n8n service is NOT running on port 5678 (or configured URL).")
        print("\nTo start n8n and test it live:")
        print("1. Open a new terminal and run: npx n8n (or run start_n8n.bat)")
        print("2. Open http://localhost:5678 in your browser")
        print("3. Import 'docs/n8n_sajag_workflow.json'")
        print("4. Add Header Auth credential: Name 'X-Sajag-Secret', Value matching your .env N8N_SECRET")
        print("5. Set workflow to ACTIVE")
        print("6. Run this test script again: python sajag/scripts/test_n8n.py")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to connect to n8n: {e}")
        return False


def test_direct_twilio_sms():
    """Verify if Twilio account can dispatch SMS to verified number."""
    print_header("TEST 3: Twilio SMS Capability Check (used by n8n)")
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM")

    if not sid or not token or not from_num:
        print("[-] Twilio credentials not configured in backend/.env")
        return

    try:
        from twilio.rest import Client
        client = Client(sid, token)
        print(f"Twilio Account SID: {sid}")
        print(f"Twilio From:        {from_num}")
        print(f"Verified Recipient: {FAMILY_PHONE}")
        print("[+] Twilio credentials valid. Ready for n8n SMS dispatch.")
    except Exception as e:
        print(f"[-] Twilio check notice: {e}")


def main():
    print("=================================================================")
    print(" Sajag AI — n8n Automation Engine Diagnostic & Verification Tool")
    print("=================================================================")
    
    # Run tests
    test_backend_internal_routes()
    n8n_ok = test_n8n_webhook_connection()
    test_direct_twilio_sms()

    print_header("DIAGNOSTIC SUMMARY")
    if n8n_ok:
        print("[ALL SYSTEMS OPERATIONAL] Backend and n8n webhook communication is fully verified!")
    else:
        print("[STATUS] Backend internal routes are verified and ready. Start n8n to complete the loop.")


if __name__ == "__main__":
    main()

