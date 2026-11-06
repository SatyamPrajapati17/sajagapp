# Sajag Cyber Shield — Web Dashboard & 1930 Incident Command Portal
**Track 5: CYBER-01 | Autonomous Voice Scam-Baiting & National Cybercrime Defense Platform**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-00F0FF?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-10B981?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF3366?style=flat-square)](https://langchain.ai)
[![Retell AI](https://img.shields.io/badge/Retell_AI-Decoy_Voice-E4FF3A?style=flat-square)](https://retellai.com)
[![Indian Evidence Act](https://img.shields.io/badge/Evidence_Act-Section_65B_Certified-00F0FF?style=flat-square)](#section-65b-indian-evidence-act-compliance)

---

## 1. Executive Summary

**Sajag Cyber Shield** is an enterprise-grade cyber defense operations portal and autonomous multi-agent voice baiting system engineered to protect Indian citizens from predatory voice-based financial extortion schemes:
- **Digital Arrest Scams** (Fake CBI, ED, Crime Branch Mumbai, or Supreme Court arrest threats)
- **Customs Contraband Seizures** (Airport illegal parcel blackmail)
- **Banking / KYC Phishing** (Impersonation of bank nodal officers demanding OTPs / Aadhaar verification)

When an unknown or spoofed call reaches a protected citizen's phone, Sajag's multi-agent architecture monitors the conversation turns in real time. Upon detecting predatory coercion ($P(\text{scam}) \ge 0.88$):
1. **Zero OTP Leakage**: The citizen's phone microphone is instantly muted.
2. **Automated Victim Protection SMS**: An urgent advisory alert is dispatched immediately to the victim.
3. **Decoy Bot Engagement**: The call is seamlessly handed over to **Ramesh Sharma**—a 72-year-old fictional decoy persona powered by Retell AI and Llama 3.3 70B who feigns hearing impairment and technical confusion, stalling scammers for 10–20+ minutes while extracting actionable intelligence.
4. **1930 Cybercrime Auto-Dispatch**: Automatically generates court-admissible electronic evidence dossiers compliant with **Section 65B of the Indian Evidence Act, 1872**, complete with SHA-256 cryptographic chain of custody, and submits them directly to the **National Cyber Crime Reporting Portal (NCRP / 1930 Helpline)** for instant debit freezes.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Mobile_Layer ["Mobile Defense Layer (Android Shield)"]
        Caller["Scammer / Unknown Caller<br/>(+919876543210)"] -->|Phone Call| App["Sajag Android App<br/>(Telephony Audio Capture)"]
        App -->|Streaming Speech Transcription| API["POST /api/mobile/turn"]
    end

    subgraph Intelligence_Core ["Multi-Agent Intelligence Core (FastAPI + LangGraph)"]
        API --> Guardian["Guardian Screening Agent<br/>(Llama 3.1 8B Instruct)"]
        Guardian -->|Calculates Risk Score| Score{"P(scam) >= 0.88?"}
        
        Score -- "No (Benign)" --> Pass["Normal Human Conversation<br/>(0% AI Interference)"]
        
        Score -- "Yes (Scam Detected)" --> Intercept["Trigger Autonomous Intercept"]
        Intercept --> Mute["Mute Citizen Microphone<br/>(Zero OTP/PIN Leakage)"]
        Intercept --> SMS["Dispatch Emergency Warning SMS<br/>(Twilio / SMS Gateway)"]
        Intercept --> Decoy["Retell AI Decoy Engine<br/>(Ramesh Sharma 72y Voice Persona)"]
    end

    subgraph Telemetry_Console ["Sajag Operations Console (Next.js 14)"]
        API & Guardian & Decoy -->|Server-Sent Events (SSE)<br/>GET /api/stream/events| HUD["Cyber Command HUD Dashboard"]
        HUD --> Gauge["Live Threat Meter (0-100%)"]
        HUD --> Trans["Dual-Channel Transcript Stream"]
        HUD --> Wave["Retell Decoy Audio Player & Waveform"]
        HUD --> Graph["Cross-Call Syndicate Relational Graph"]
        HUD --> Table["Mule Handles & Accounts DataTable"]
    end

    subgraph Government_NCRP ["National Cybercrime Infrastructure (MHA NCRP)"]
        HUD -->|1-Click Auto-Dispatch<br/>POST /api/cybercrime/dispatch| NCRP["1930 Helpline / NCRP Switchboard"]
        NCRP --> PDF["Section 65B Certified PDF Evidence Dossier"]
        NCRP --> NPCI["Emergency NPCI Debit Freeze"]
    end
```

---

## 3. Core Capabilities & Module Specifications

### 3.1 Real-Time Mobile Telemetry (SSE & WebSockets)
- **Active Call Screening Badge**: Displays real-time carrier lookup and active status (`ACTIVE CALL SCREENING: +919876543210`).
- **Live Dual-Channel Transcript Monitor**: Displays turns between caller and victim/decoy in real-time with color-coded badges (`[SCAMMER]` vs `[RAMESH SHARMA / DECOY]`).
- **Live Threat Speedometer**: High-precision SVG risk gauge bound to $P(\text{scam})$ (0% to 100%) with an autonomous takeover threshold marker at `0.88`.
- **Decoy Waveform Audio Player**: Active waveform visualizer displaying live bait stall duration (10+ minutes).

### 3.2 Automated Victim Protection SMS Pipeline
When $P(\text{scam}) \ge 0.88$, an automated warning is dispatched instantly via Twilio/SMS Gateway:
```text
🚨 SAJAG CYBER ALERT: A scam call claiming to be CBI from +919876543210 was intercepted on your mobile. Your microphone was muted to prevent OTP/PIN theft. Decoy Bot is baiting the scammer. DO NOT transfer money. Case Ref: mob-9922-cbi.
```

### 3.3 Suspect Mule Intelligence Feed
Extracts and validates identifiers in PostgreSQL/Supabase:
- **`upi`**: e.g., `police.verify@sbi`, `customs.clearance@hdfc`
- **`org_claimed`**: Impersonated agency (e.g., `CBI / Crime Branch Mumbai`, `TRAI`, `Cyber Cell`)
- **`phone`**: Scammer caller ID and callback numbers
- **`quote`**: Grounded transcript quotation proving intent
- **`is_duplicate`**: Cross-incident duplicate marker identifying syndicate links (`CROSS_INCIDENT_SYNDICATE_MULE`)

### 3.4 1930 Cybercrime Auto-Dispatch & Section 65B Compliance
- **1-Click Auto-Dispatch**: Generates court-admissible electronic evidence dossiers and posts to NCRP API.
- **Section 65B Indian Evidence Act Certificate**: Cryptographically binds transcript hashes and timestamps with SHA-256 chain of custody.
- **Instant Status Indicator**: Confirms acknowledgment with official reference (`NCRP-1930-XXXX-XXXXXX`).

---

## 4. Environment Variables Specification

### Frontend Configuration (`sajag/frontend/.env.local`)
```env
# URL of the Sajag FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Public Tunnel URL (when deploying with ngrok / Cloudflare Tunnel)
NEXT_PUBLIC_TUNNEL_URL=https://your-tunnel-subdomain.trycloudflare.com
```

### Backend Configuration (`sajag/backend/.env`)
```env
# Server
PORT=8000
FRONTEND_URL=http://localhost:3000
PUBLIC_BASE_URL=https://your-tunnel-subdomain.trycloudflare.com

# LLM Inference (NVIDIA NIM / Groq / OpenAI)
NVIDIA_API_KEY=nvapi-your-key-here
GUARDIAN_MODEL=meta/llama-3.1-8b-instruct
DECOY_MODEL=meta/llama-3.3-70b-instruct
TAKEOVER_THRESHOLD=0.88

# PostgreSQL / Supabase
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telephony (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM=+1xxxxxxxxxx
FAMILY_PHONE=+91xxxxxxxxxx
FORWARD_TO_REAL_PHONE=true

# Retell AI Voice Engine
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-retell-agent-id

# n8n Automation & MHA NCRP Webhook
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/sajag-events
N8N_SECRET=sajag-secret-key-change-me
CYBERCRIME_API_KEY=ncrp-mha-gov-in-auth-key
```

---

## 5. API Endpoint Contracts & Payloads

### 5.1 Mobile Transcription Turn Ingestion
* **Method**: `POST`
* **Path**: `/api/mobile/turn`
* **Request Payload**:
```json
{
  "call_id": "mob-9922-cbi",
  "caller_number": "+919876543210",
  "speaker": "scammer",
  "text": "I am Inspector Rathore from Mumbai Crime Branch. Transfer Rs 25000 to police.verify@sbi immediately or arrest warrant FIR/2026/894 will be executed."
}
```
* **Response Payload**:
```json
{
  "call_id": "mob-9922-cbi",
  "p_scam": 0.96,
  "level": "CRITICAL",
  "mode": "DECOY",
  "category": "DIGITAL_ARREST",
  "signals": ["authority_impersonation", "threat_of_arrest", "immediate_payment_demand"],
  "should_handover": true,
  "handover_audio_url": "https://your-domain.com/audio/ramesh_voice.mp3",
  "decoy_reply": "Arey sahab ji ghabrahat ho rahi hai, mere pass koi wakil nahi hai. UPI ID ki spelling boliye, diary mein likh raha hoon.",
  "retell_agent_id": "agent_xxxxxxxxxxxxxxxxxxxxxxxx",
  "extracted_identifiers": [
    {
      "type": "upi",
      "value": "police.verify@sbi",
      "syntax_valid": true,
      "quote": "Transfer Rs 25000 to police.verify@sbi immediately"
    }
  ],
  "safety_blocks": 2
}
```

---

### 5.2 Real-Time SSE Telemetry Stream
* **Method**: `GET`
* **Path**: `/api/stream/events`
* **Headers**: `Accept: text/event-stream`
* **Stream Events**:
  - `mobile_screening`: Incoming call detected on Android device.
  - `turn`: Speech turns from caller and decoy.
  - `threat_update`: Real-time risk speedometer updates.
  - `decoy_activated`: Decoy takeover trigger.
  - `cybercrime_dispatched`: Confirmation when 1930 NCRP dossier is filed.

---

### 5.3 1930 Cybercrime Auto-Dispatch Endpoint
* **Method**: `POST`
* **Path**: `/api/cybercrime/dispatch`
* **Request Payload**:
```json
{
  "call_id": "mob-9922-cbi",
  "caller": "+919876543210",
  "officer_badge": "POLICE-MH-709",
  "portal_target": "NCRP_1930_CENTRAL_SWITCH",
  "org_claimed": "CBI / Crime Branch Mumbai",
  "notes": "Autonomous Decoy court-ready Section 65B evidence dossier submitted for emergency freeze."
}
```
* **Response Payload**:
```json
{
  "id": "disp-1793515294",
  "call_id": "mob-9922-cbi",
  "caller": "+919876543210",
  "report_id": "SAJAG-MOB-9922",
  "ncrp_ack_id": "NCRP-1930-1793515294-9A4F62",
  "status": "DELIVERED TO MHA NCRP",
  "portal_target": "NCRP_1930_CENTRAL_SWITCH",
  "officer_badge": "POLICE-MH-709",
  "sha256_hash": "fb1280ebc1ad93ec91d5c67d13b38add93716e1e5850b58199abb27c5ccde380",
  "evidence_act_section": "Section 65B(4) Certified",
  "dispatched_at": "2026-11-01T06:41:34Z",
  "mule_handles": ["police.verify@sbi", "+919876543210"],
  "transcript_summary": "Call from +919876543210 intercepted claiming to be CBI Crime Branch. Threat score 94%. Decoy agent engaged for 120s. Mule handles extracted: police.verify@sbi, +919876543210.",
  "pdf_url": "/reports/mob-9922-cbi/pdf"
}
```

---

### 5.4 Suspect Mule Intelligence Feed
* **Method**: `GET`
* **Path**: `/api/extracted-identifiers`
* **Response Payload**:
```json
{
  "identifiers": [
    {
      "call_id": "call-cbi-894",
      "turn_seq": 2,
      "type": "upi",
      "value": "police.verify@sbi",
      "normalized": "police.verify@sbi",
      "syntax_valid": true,
      "org_claimed": "CBI / Crime Branch Mumbai",
      "phone": "+919876543210",
      "quote": "Transfer immediately to police.verify@sbi",
      "confidence": 1.0,
      "status": "CROSS_INCIDENT_SYNDICATE_MULE",
      "is_duplicate": true,
      "created_at": "2026-11-01T06:41:47Z"
    }
  ]
}
```

---

## 6. Local Development Setup

### Step 1: Start the Backend
```bash
cd c:\cyber\sajag\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API documentation available at `http://localhost:8000/docs`.*

### Step 2: Start the Frontend
```bash
cd c:\cyber\sajag\frontend
npm install
npm run dev
```
*Operations Console runs on `http://localhost:3000`.*

---

## 7. Production Deployment Guide

### Deploying Frontend to Vercel
1. Link your GitHub repository (`SatyamPrajapati17/sajagapp`) in the [Vercel Dashboard](https://vercel.com/new).
2. Set **Root Directory** to `sajag/frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your hosted backend URL (e.g. `https://sajag-api.up.railway.app`).
4. Click **Deploy**.

### Deploying Backend to Railway
1. Create a new service in [Railway](https://railway.app) from your GitHub repository.
2. Set **Root Directory** to `sajag/backend`.
3. Set start command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Configure environment variables (`DATABASE_URL`, `TWILIO_ACCOUNT_SID`, `RETELL_API_KEY`, etc.).

---

## 8. Section 65B Indian Evidence Act Compliance

All evidentiary reports generated by Sajag AI strictly comply with **Section 65B(4) of the Indian Evidence Act, 1872**:
1. **Source Integrity**: Every speech turn is cryptographically hashed (`SHA-256`) and chained to its preceding turn.
2. **Device Forensics**: Captures carrier line metadata and Twilio call SID.
3. **Court Admissibility Certificate**: Every generated PDF contains a formal Section 65B Certificate declaring that electronic records were produced autonomously without manual tampering.
4. **Direct NPCI Freeze Feed**: Extracted UPI IDs and bank accounts are formatted for immediate ingestion by bank nodal officers and NPCI cyber fraud units.

---

**© 2026 Sajag AI Cyber Defense Consortium. Developed for Track 5: CYBER-01.**
