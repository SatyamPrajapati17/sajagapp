#!/usr/bin/env python3
"""
Sajag AI — Outbound Twilio Voice Call Trigger.
Places a real phone call from Twilio (+17372508034) to your verified number (+919922996010).
When you pick up, it connects you directly to the Sajag AI engine and Ramesh Sharma.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(ENV_PATH)

from twilio.rest import Client

sid = os.getenv("TWILIO_ACCOUNT_SID", "")
token = os.getenv("TWILIO_AUTH_TOKEN", "")
from_num = os.getenv("TWILIO_FROM", "")
to_num = os.getenv("FAMILY_PHONE", "")
tunnel_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")

if not sid or not token:
    print("[!] Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in backend/.env")
    sys.exit(1)

if not tunnel_url or "localhost" in tunnel_url:
    print("[!] Warning: PUBLIC_BASE_URL is not set to a public tunnel.")
    tunnel_url = "https://your-tunnel-url.ngrok-free.app"

voice_url = f"{tunnel_url}/twilio/voice"
status_url = f"{tunnel_url}/twilio/status"

print("=" * 60)
print(" Sajag AI — Placing Live Outbound Call via Twilio API")
print("=" * 60)
print(f"From (Twilio):    {from_num}")
print(f"To (Your Phone):  {to_num}")
print(f"Webhook Voice URL: {voice_url}")

try:
    client = Client(sid, token)
    call = client.calls.create(
        to=to_num,
        from_=from_num,
        url=voice_url,
        status_callback=status_url,
        status_callback_event=["completed", "answered"]
    )
    print("\n[SUCCESS] Call initiated successfully!")
    print(f"Call SID:   {call.sid}")
    print(f"Status:     {call.status}")
    print(f"Check your phone {to_num} - it should ring shortly!")
except Exception as e:
    print(f"\n[-] Twilio Call Error: {e}")

