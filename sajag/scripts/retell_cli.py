#!/usr/bin/env python3
"""
Sajag AI — Retell CLI Management Tool.
CLI utility to manage Retell AI phone numbers, Custom-LLM agents, and webhooks.
"""

import os
import sys
import argparse
import json
from pathlib import Path
from dotenv import load_dotenv

# Path to backend .env
ENV_PATH = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(ENV_PATH)

def get_retell_key():
    key = os.getenv("RETELL_API_KEY", "")
    if not key or key.startswith("mock"):
        print("\n[!] RETELL_API_KEY not found in backend/.env")
        key = input("Enter your Retell API Key (from retellai.com dashboard): ").strip()
        if key:
            # Update .env
            update_env("RETELL_API_KEY", key)
    return key

def update_env(key_name: str, key_val: str):
    if not ENV_PATH.exists():
        ENV_PATH.write_text(f"{key_name}={key_val}\n")
        return
    content = ENV_PATH.read_text(encoding="utf-8")
    if f"{key_name}=" in content:
        lines = []
        for line in content.splitlines():
            if line.startswith(f"{key_name}="):
                lines.append(f"{key_name}={key_val}")
            else:
                lines.append(line)
        ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    else:
        with open(ENV_PATH, "a", encoding="utf-8") as f:
            f.write(f"\n{key_name}={key_val}\n")
    print(f"[+] Saved {key_name} into {ENV_PATH}")


def list_phone_numbers(api_key: str):
    """Lists phone numbers currently in the Retell account."""
    import httpx
    print("\n[*] Fetching phone numbers from Retell AI...")
    try:
        resp = httpx.get(
            "https://api.retellai.com/list-phone-numbers",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10.0
        )
        if resp.status_code == 200:
            numbers = resp.json()
            if not numbers:
                print("[-] No phone numbers found on Retell yet.")
            else:
                print("\nPhone Numbers on Retell:")
                print("=" * 60)
                for item in numbers:
                    num = item.get("phone_number")
                    pretty = item.get("phone_number_pretty", num)
                    agent = item.get("inbound_agent_id", "Not bound")
                    nick = item.get("nickname", "None")
                    print(f"Number: {pretty} ({num}) | Agent: {agent} | Nickname: {nick}")
                print("=" * 60)
        else:
            print(f"[-] Error listing numbers ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"[-] Request failed: {e}")


def import_phone_number(api_key: str, phone_number: str, agent_id: str = "", nickname: str = "Sajag Twilio"):
    """Imports or registers an external Twilio phone number into Retell."""
    import httpx
    print(f"\n[*] Importing phone number {phone_number} to Retell AI...")
    
    # Clean number format
    clean_num = phone_number.strip().replace(" ", "").replace("-", "")
    if not clean_num.startswith("+"):
        clean_num = "+" + clean_num

    payload = {
        "phone_number": clean_num,
        "nickname": nickname,
    }
    
    # Check if SIP termination or agent is configured
    sip_host = os.getenv("RETELL_SIP_HOST", "sip.retellai.com")
    payload["termination_uri"] = sip_host

    if agent_id:
        payload["inbound_agent_id"] = agent_id

    try:
        # Try Retell API import endpoint
        resp = httpx.post(
            "https://api.retellai.com/import-phone-number",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=12.0
        )
        
        if resp.status_code in (200, 201):
            data = resp.json()
            print(f"[SUCCESS] Phone number {clean_num} imported to Retell!")
            print(json.dumps(data, indent=2))
            update_env("TWILIO_FROM", clean_num)
        elif resp.status_code == 400 and "already exists" in resp.text.lower():
            print(f"[+] Phone number {clean_num} is already registered on Retell.")
        else:
            # Try v2 or create endpoint fallback
            resp2 = httpx.post(
                "https://api.retellai.com/create-phone-number",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=12.0
            )
            if resp2.status_code in (200, 201):
                print(f"[SUCCESS] Phone number {clean_num} created/imported on Retell!")
                print(json.dumps(resp2.json(), indent=2))
            else:
                print(f"[-] Notice from Retell API ({resp.status_code}): {resp.text}")
                print(f"\nTip: If you're importing a Twilio number into Retell, you can also link it directly in the Retell dashboard under:")
                print("     retellai.com -> Phone Numbers -> Import Twilio Number (enters Twilio SID + Token)")
    except Exception as e:
        print(f"[-] Error importing number: {e}")


def create_or_update_agent(api_key: str, ws_url: str = ""):
    """Creates or updates the Sajag Custom-LLM Agent on Retell."""
    import httpx
    print("\n[*] Configuring Sajag Custom-LLM Agent on Retell AI...")
    
    if not ws_url:
        tunnel = os.getenv("PUBLIC_BASE_URL", "")
        if tunnel:
            host = tunnel.replace("https://", "").replace("http://", "").strip("/")
            ws_url = f"wss://{host}/llm-ws"
        else:
            ws_url = input("Enter your public WebSocket URL (e.g. wss://xxxx.ngrok-free.app/llm-ws): ").strip()

    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "Js0TcY46UZglv3pqATF4")
    webhook_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/") + "/retell/webhook" if os.getenv("PUBLIC_BASE_URL") else ""

    payload = {
        "agent_name": "Ramesh Sharma (Sajag AI Decoy)",
        "response_engine": {
            "type": "custom_llm",
            "llm_websocket_url": ws_url
        },
        "voice_id": f"elevenlabs-{voice_id}" if not voice_id.startswith("elevenlabs") else voice_id,
        "language": "en-US",
        "webhook_url": webhook_url
    }

    try:
        resp = httpx.post(
            "https://api.retellai.com/create-agent",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=12.0
        )
        if resp.status_code in (200, 201):
            agent_data = resp.json()
            agent_id = agent_data.get("agent_id")
            print(f"[SUCCESS] Created Retell Custom-LLM Agent: {agent_id}")
            update_env("RETELL_AGENT_ID", agent_id)
            return agent_id
        else:
            print(f"[-] Retell Agent creation response ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"[-] Error: {e}")
    return None


def main():
    parser = argparse.ArgumentParser(description="Sajag AI — Retell CLI Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # list-numbers
    subparsers.add_parser("list-numbers", help="List phone numbers registered on Retell")

    # add-number / import-number
    add_num_parser = subparsers.add_parser("add-number", help="Import a phone number into Retell")
    add_num_parser.add_argument("--phone", default="", help="E.164 phone number (e.g. +17372508034)")
    add_num_parser.add_argument("--agent-id", default="", help="Retell Agent ID to bind to")
    add_num_parser.add_argument("--nickname", default="Sajag Twilio Phone", help="Optional nickname")

    # create-agent
    agent_parser = subparsers.add_parser("create-agent", help="Create or configure Ramesh Sharma Custom-LLM Agent")
    agent_parser.add_argument("--ws-url", default="", help="Custom LLM WebSocket URL (wss://...)")

    args = parser.parse_args()

    api_key = get_retell_key()
    if not api_key:
        print("[-] Retell API Key is required to run Retell CLI commands.")
        sys.exit(1)

    if args.command == "list-numbers":
        list_phone_numbers(api_key)
    elif args.command == "add-number":
        phone = args.phone or os.getenv("TWILIO_FROM", "+17372508034")
        agent_id = args.agent_id or os.getenv("RETELL_AGENT_ID", "")
        import_phone_number(api_key, phone, agent_id, args.nickname)
    elif args.command == "create-agent":
        create_or_update_agent(api_key, args.ws_url)
    else:
        print("\nSajag AI — Retell CLI Utility")
        print("Available commands:")
        print("  retell-cli list-numbers")
        print("  retell-cli add-number --phone +17372508034")
        print("  retell-cli create-agent")

if __name__ == "__main__":
    main()

