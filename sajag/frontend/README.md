# Sajag Cyber Shield — Web Dashboard & 1930 Incident Command Portal
**Track 5: CYBER-01 | Autonomous Voice Scam-Baiting & National Cybercrime Defense Platform**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-00F0FF?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-10B981?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF3366?style=flat-square)](https://langchain.ai)
[![Retell AI](https://img.shields.io/badge/Retell_AI-Decoy_Voice-E4FF3A?style=flat-square)](https://retellai.com)
[![Indian Evidence Act](https://img.shields.io/badge/Evidence_Act-Section_65B_Certified-00F0FF?style=flat-square)](#section-65b-indian-evidence-act-compliance)

---

## 1. Executive Summary

**Sajag Cyber Shield** is an enterprise-grade cyber defense operations portal designed to autonomously intercept, bait, analyze, and neutralize voice-based financial extortion scams (such as **Digital Arrest**, **CBI / Police Impersonation**, **Customs Contraband Seizures**, and **Bank KYC OTP Phishing**).

When an unknown or spoofed call reaches a protected citizen's phone, Sajag's multi-agent architecture monitors the call in real time. Upon detecting predatory coercion ($P(\text{scam}) \ge 0.88$), the citizen's microphone is instantly muted to prevent OTP/PIN theft, an automated emergency warning SMS is dispatched to the victim, and the call is seamlessly transferred to **Ramesh Sharma**—a 72-year-old fictional decoy persona powered by Retell AI and ElevenLabs. 

The web portal streams telemetry with sub-second latency, maintains an interactive cross-incident criminal syndicate relational graph, and auto-generates court-ready electronic evidence dossiers compliant with **Section 65B of the Indian Evidence Act, 1872** for instantaneous submission to the **National Cyber Crime Reporting Portal (NCRP / 1930 Helpline)**.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Mobile_Layer ["Mobile Defense Layer (Android Shield)"]
        A["Incoming Caller<br/>(+919876543210)"] -->|Audio Stream| B["Sajag Android App<br/>(Call Interceptor & Telephony)"]
        B -->|Live Speech Transcription| C["FastAPI Turn Ingestion<br/>POST /api/mobile/turn"]
    end

    subgraph Intelligence_Core ["Multi-Agent Intelligence Core"]
        C --> D["LangGraph Guardian Agent<br/>(Llama 3.1 8B Instruct)"]
        D -->|Calculates Risk P_scam| E{"P_scam >= 0.88?"}
        
        E -- No: Benign --> F["Normal Human Conversation<br/>(0% AI Interference)"]
        
        E -- Yes: Scam --> G["Decoy Takeover Engine<br/>(Llama 3.3 70B + Retell AI)"]
        G -->|Audio Stream| H["Ramesh Sharma Persona<br/>(Feigns Hearing Loss & Confusion)"]
    end

    subgraph Citizen_Protection ["Automated Victim Shielding"]
        G --> I["Mute Citizen Microphone<br/>(Guarantees Zero OTP/PIN Leak)"]
        G --> J["Twilio / SMS Gateway<br/>(Emergency Advisory SMS Dispatched)"]
    end

    subgraph Telemetry_Portal ["Sajag Web Operations Portal (Next.js 14)"]
        C & G & E -->|Server-Sent Events (SSE)<br/>GET /api/stream/events| K["Cyber Command HUD Dashboard"]
        K --> L["Live Threat Speedometer (0-100%)"]
        K --> M["Dual-Channel Transcript Monitor"]
        K --> N["Waveform Audio Player (10+ min stall)"]
        K --> O["Cross-Call Syndicate Relational Graph"]
        K --> P["Mule Handles & Accounts DataTable"]
    end

    subgraph Government_NCRP ["National Cybercrime Infrastructure"]
        K -->|1-Click Auto-Dispatch<br/>POST /api/cybercrime/dispatch| Q["1930 Helpline / NCRP Switchboard"]
        Q --> R["Section 65B Certified PDF Evidence Dossier"]
        Q --> S["NPCI Emergency Mule Account Freeze"]
    end
```

---

## 3. Core Capabilities & Module Specifications

### 3.1 Real-Time Mobile Data Streaming (SSE & WebSockets)
- **Active Call Screening Badge**: When an Android device running the Sajag Shield receives an unsolicited call, the web portal immediately displays an animated status badge: `ACTIVE CALL SCREENING: +919876543210`.
- **Live Dual-Channel Transcript**: Displays conversational turns between the scammer and the victim/decoy in real time with distinct cyber-themed badge indicators (`[CALLER / SCAMMER]` vs `[RAMESH SHARMA / DECOY]`).
- **Dynamic Threat Speedometer**: Real-time SVG gauge bound to `p_scam` (0% to 100%) with a strict `0.88` autonomous takeover threshold marker.
- **Decoy Waveform Audio Monitor**: When `status === 'DECOY_ACTIVE'`, the Retell AI Decoy Player visualizes the audio stream waveform and tracks the scammer stall timer (12+ minutes).

### 3.2 Automated Victim Protection SMS Pipeline
When risk score $P(\text{scam}) \ge 0.88$ is reached, the backend triggers an emergency SMS notification to the victim's verified mobile line (`+919922996010`):
```text
🚨 SAJAG CYBER ALERT: A scam call claiming to be CBI from +919876543210 was intercepted on your mobile. Your microphone was muted to prevent OTP/PIN theft. Decoy Bot is baiting the scammer. DO NOT transfer money. Case Ref: call-cbi-894.
```

### 3.3 Suspect Mule Intelligence Storage
All payment handles and caller credentials extracted during the call are validated and stored in PostgreSQL/Supabase:
- **`upi`**: e.g., `police.verify@sbi`, `customs.tax@ybl`
- **`org_claimed`**: Impersonated authority (e.g., `CBI / Crime Branch Mumbai`, `TRAI`, `Mumbai Police`)
- **`phone`**: Scammer caller ID and callback numbers
- **`quote`**: Verbatim transcript sentence providing grounded evidentiary proof
- **`is_duplicate`**: Cross-call duplicate correlation tag marking recurring syndicate handles (`CROSS_INCIDENT_SYNDICATE_MULE`)

### 3.4 1930 Cybercrime Gov Auto-Sharing & Section 65B Compliance
- **1-Click Dispatch Station**: Dispatches a court-admissible evidence dossier directly to the **National Cyber Crime Reporting Portal (NCRP)** API and Helpline 1930 switchboard.
- **Section 65B Indian Evidence Act Certificate**: Cryptographically binds the digital recordings, transcript hashes, and timestamp logs into an unalterable SHA-256 evidence packet.
- **Instant Status Indicator**: Updates to `DELIVERED TO MHA NCRP` with an official acknowledgment reference (`NCRP-1930-XXXX-XXXXXX`).

---

## 4. Environment Variables Specification

Create `.env` in `sajag/backend` and `.env.local` in `sajag/frontend`:

### Frontend Configuration (`sajag/frontend/.env.local`)
```env
# URL of the Sajag FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Public Cloudflare Tunnel URL (when accessing remotely)
NEXT_PUBLIC_TUNNEL_URL=https://nitrogen-aggregate-dirt-nursery.trycloudflare.com

# Mapbox / Leaflet Tiles (Optional geolocation rendering)
NEXT_PUBLIC_MAP_KEY=pk_test_sample
```

### Backend Configuration (`sajag/backend/.env`)
```env
# Server
PORT=8000
FRONTEND_URL=http://localhost:3000
PUBLIC_BASE_URL=https://nitrogen-aggregate-dirt-nursery.trycloudflare.com

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
Streams live caller audio transcription from Android speech recognizer into the multi-agent detection state machine.

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
  "handover_audio_url": "https://nitrogen-aggregate-dirt-nursery.trycloudflare.com/audio/ramesh_voice.mp3",
  "decoy_reply": "Arey sahab ji ghabrahat ho rahi hai, mere pass koi wakil nahi hai. UPI ID ki spelling boliye, diary mein likh raha hoon.",
  "retell_agent_id": "agent_a138f57405894ecbec54273506",
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
Connects the web frontend to the event bus for reactive updates without polling.

* **Method**: `GET`
* **Path**: `/api/stream/events`
* **Headers**: `Accept: text/event-stream`
* **Stream Events Emitted**:
  - `mobile_screening`: Dispatched when an incoming call starts screening on mobile.
  - `turn`: Emitted on every speaker turn (both caller and decoy).
  - `threat_update`: Live risk meter updates containing `p_scam` and detected signals.
  - `decoy_activated`: Dispatched upon autonomous takeover.
  - `cybercrime_dispatched`: Real-time notification when a 1930 NCRP report is submitted.

---

### 5.3 1930 Cybercrime Auto-Dispatch Endpoint
Compiles the Section 65B certified evidence dossier and submits it to the National Cyber Crime Reporting Portal API.

* **Method**: `POST`
* **Path**: `/api/cybercrime/dispatch` (alias: `/api/cybercrime/dispatch-report`)
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
Returns all verified suspect handles and accounts with cross-call duplicate correlation indicators.

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

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- (Optional) Docker for local PostgreSQL

### Step 1: Clone and Configure Backend
```bash
cd c:\cyber\sajag\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Start the FastAPI backend:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (docs available at `/docs`).*

### Step 2: Configure & Start Frontend
```bash
cd c:\cyber\sajag\frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 7. Production Deployment Guide

### Deploying the Frontend to Vercel
1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository and set the **Root Directory** to `sajag/frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your hosted backend URL (e.g. `https://sajag-api.up.railway.app`)
4. Click **Deploy**. Vercel will build and host the edge-optimized Next.js dashboard.

### Deploying the Backend to Railway
1. In the [Railway Dashboard](https://railway.app), create a new project from your GitHub repository.
2. Set the **Root Directory** to `sajag/backend`.
3. Add the Python buildpack and configure start command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Configure all environment variables from Section 4 (`SUPABASE_URL`, `TWILIO_ACCOUNT_SID`, `RETELL_API_KEY`, etc.).
5. Link a PostgreSQL database plugin or your hosted Supabase instance.

---

## 8. Section 65B Indian Evidence Act Compliance

All evidentiary reports generated by Sajag AI comply with **Section 65B(4) of the Indian Evidence Act, 1872**:
1. **Source Integrity**: Every speech turn is cryptographically hashed (`SHA-256`) and chained to its preceding turn.
2. **Device Forensics**: Captures carrier line metadata (Vodafone Idea / Jio / Airtel mobile type intelligence) and Twilio call SID.
3. **Court Admissibility Certificate**: Every generated PDF contains a formal Section 65B Certificate declaring that electronic records were produced autonomously without manual tampering during ordinary operations.
4. **Direct NPCI Freeze Feed**: Extracted UPI IDs are formatted for immediate ingestion by bank nodal officers and NPCI cyber fraud units.

---

**© 2026 Sajag AI Cyber Defense Consortium. Developed for Track 5: CYBER-01.**
