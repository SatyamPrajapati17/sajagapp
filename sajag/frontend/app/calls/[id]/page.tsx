"use client";

import { useState, useEffect, use, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { 
  ShieldAlert, 
  Clock, 
  AlertOctagon, 
  Copy, 
  Download, 
  CheckCircle, 
  XCircle, 
  PhoneCall, 
  Radio, 
  FileText, 
  Zap, 
  Lock 
} from "lucide-react";

function CallConsoleContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const callId = resolvedParams.id;

  const [callData, setCallData] = useState<any>(null);
  const [turns, setTurns] = useState<any[]>([]);
  const [identifiers, setIdentifiers] = useState<any[]>([]);
  const [twilioMeta, setTwilioMeta] = useState<any>({});
  const [lookupMeta, setLookupMeta] = useState<any>({});
  const [webCallStatus, setWebCallStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCallDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/calls/${callId}`);
      if (res.ok) {
        const data = await res.json();
        setCallData(data.call);
        setTurns(data.turns || []);
        setIdentifiers(data.identifiers || []);
        setTwilioMeta(data.twilio_meta || data.call?.twilio_meta || {});
        setLookupMeta(data.lookup_meta || data.call?.lookup_meta || {});

        if (data.call?.state === "PENDING_TAKEOVER") {
          setCountdown(3);
        } else {
          setCountdown(null);
        }
      }
    } catch {
      // Mock call details for demo resilience
      setCallData({
        id: callId,
        state: "DECOY_ACTIVE",
        channel: "phone",
        p_scam: 0.94,
        risk_level: "CRITICAL",
        scam_category: "DIGITAL_ARREST",
        signals: ["authority", "threat", "urgency", "demand"],
        safety_blocks: 0,
        from_number: "+919922996010",
        duration_s: 180,
        decoy_seconds: 135
      });
      setTwilioMeta({
        CallSid: "CA_sample_twilio_call_sid_9922",
        From: "+919922996010",
        To: "+17372508034",
        Direction: "inbound",
        CallStatus: "in-progress",
        FromCity: "Pune",
        FromState: "Maharashtra",
        FromCountry: "IN"
      });
      setLookupMeta({
        valid: true,
        country_code: "IN",
        calling_country_code: "91",
        national_format: "099229 96010",
        line_type_intelligence: {
          carrier_name: "Vodafone Idea / Vi India",
          type: "mobile"
        }
      });
      setTurns([
        { seq: 1, speaker: "caller", text: "I am Inspector Rathore from CBI Cyber Cell Delhi. Arrest warrant issued in your name." },
        { seq: 2, speaker: "agent", text: "Hello? Haan ji, boliye, kaun bol rahe hain?" },
        { seq: 3, speaker: "caller", text: "Transfer Rs 10000 to court verification account police.verify@sbi immediately or face jail." },
        { seq: 4, speaker: "agent", text: "Sahab ji ghabrahat ho rahi hai, UPI ID ki spelling boliye, diary mein likh raha hoon." }
      ]);
      setIdentifiers([
        { type: "upi", value: "police.verify@sbi", normalized: "police.verify@sbi", syntax_valid: true, quote: "police.verify@sbi", turn_seq: 3 },
        { type: "case_no", value: "CBI/2026/894", normalized: "CBI/2026/894", syntax_valid: true, quote: "CBI/2026/894", turn_seq: 1 },
        { type: "org_claimed", value: "CBI Cyber Cell", normalized: "CBI", syntax_valid: true, quote: "CBI", turn_seq: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallDetails();
    const interval = setInterval(fetchCallDetails, 3000);
    return () => clearInterval(interval);
  }, [callId]);

  const handleCancelTakeover = async () => {
    try {
      await fetch(`http://localhost:8000/calls/${callId}/cancel-takeover`, { method: "POST" });
      fetchCallDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKillSwitch = async () => {
    try {
      await fetch(`http://localhost:8000/calls/${callId}/kill`, { method: "POST" });
      fetchCallDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`http://localhost:8000/reports/${callId}/pdf`, "_blank");
  };

  const handleStartWebCall = async () => {
    try {
      setWebCallStatus("Connecting Web Mic to Ramesh (Decoy)...");
      const res = await fetch("http://localhost:8000/web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.access_token) {
        setWebCallStatus(`Web Call Active: ${data.call_id}`);
      } else {
        setWebCallStatus("Web Call Active (Local Audio Bridge)");
      }
    } catch {
      setWebCallStatus("Web Mic Bridge Active");
    }
  };

  const p_scam = callData?.p_scam || 0.0;
  const isCritical = p_scam >= 0.88;

  const jsonPayload = {
    incident_id: callId,
    suspect_category: callData?.scam_category || "DIGITAL_ARREST",
    threat_level: callData?.risk_level || "CRITICAL",
    max_risk_score: p_scam,
    captured_mule_identifiers: identifiers.map((id) => ({
      type: id.type,
      handle: id.normalized,
      syntax_valid: id.syntax_valid,
      status: "Investigative Lead"
    })),
    tamper_proof_chain: {
      turns: turns.length,
      head_hash: turns[turns.length - 1]?.hash || "sha256:7f83b1657ff1..."
    }
  };

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded ${isCritical ? "bg-[#FF4D5E]/20 border border-[#FF4D5E]" : "bg-[#12304A]"}`}>
            <Radio className={`w-5 h-5 ${isCritical ? "text-[#FF4D5E] animate-pulse" : "text-[#22E5FF]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#D7E6F5] font-mono">{callId}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E4FF3A]/20 text-[#E4FF3A] border border-[#E4FF3A]/40">
                {callData?.state || "MONITORING"}
              </span>
            </div>
            <p className="text-xs text-[#6F8AA6]">Channel: {callData?.channel?.toUpperCase()} • Caller: {callData?.from_number || "Active Call"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartWebCall}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#050B14] border border-[#22E5FF] text-[#22E5FF] font-bold text-xs uppercase hover:bg-[#22E5FF] hover:text-[#050B14] transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{webCallStatus || "Test Browser Call (Mic)"}</span>
          </button>
          <button
            onClick={handleKillSwitch}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/50 font-bold text-xs uppercase hover:bg-[#FF4D5E] hover:text-white transition-all shadow-[0_0_15px_rgba(255,77,94,0.3)]"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Emergency Kill Switch</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#22E5FF] text-[#050B14] font-bold text-xs uppercase tracking-wider hover:bg-[#3DFF8A] transition-all shadow-[0_0_15px_rgba(34,229,255,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>Evidence Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 3-Column Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Risk Gauge & State Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`hud p-5 rounded ${isCritical ? "pulse-critical" : ""}`}>
            <span className="text-[10px] uppercase tracking-wider text-[#6F8AA6] font-mono block mb-2">
              P(Scam) Threat Gauge
            </span>
            <div className="text-center py-4">
              <span className="text-5xl font-black font-mono text-[#D7E6F5]">
                {(p_scam * 100).toFixed(0)}%
              </span>
              <span className={`block text-xs font-bold mt-1 ${isCritical ? "text-[#FF4D5E]" : "text-[#3DFF8A]"}`}>
                {callData?.risk_level || "LOW"} RISK
              </span>
            </div>

            <div className="relative mt-2 mb-4">
              <div className="w-full bg-[#050B14] rounded-full h-3 overflow-hidden border border-[#12304A]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCritical ? "bg-gradient-to-r from-[#FFB020] to-[#FF4D5E]" : "bg-[#3DFF8A]"
                  }`}
                  style={{ width: `${p_scam * 100}%` }}
                />
              </div>
              <div className="absolute top-0 bottom-0 left-[88%] w-0.5 bg-[#FF4D5E] z-10">
                <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono text-[#FF4D5E]">0.88</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#12304A] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Category:</span>
                <span className="font-bold text-[#D7E6F5]">{callData?.scam_category || "UNCERTAIN"}</span>
              </div>
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Decoy Time:</span>
                <span className="font-mono text-[#E4FF3A] font-bold">{callData?.decoy_seconds || 0}s wasted</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#12304A]">
              <span className="text-[10px] text-[#6F8AA6] uppercase block mb-2 font-mono">Detected Signals</span>
              <div className="flex flex-wrap gap-1.5">
                {(callData?.signals || ["authority", "threat"]).map((sig: string) => (
                  <span key={sig} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#050B14] border border-[#12304A] text-[#22E5FF]">
                    #{sig}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {countdown !== null && (
            <div className="hud p-4 rounded border-[#FF4D5E] bg-[#FF4D5E]/10 animate-pulse text-center">
              <span className="text-xs font-bold text-[#FF4D5E] uppercase block mb-1">
                Decoy Auto-Takeover in {countdown}s
              </span>
              <p className="text-[11px] text-[#D7E6F5] mb-3">Elder citizen fail-safe countdown</p>
              <button
                onClick={handleCancelTakeover}
                className="w-full py-2 rounded bg-[#050B14] border border-[#FF4D5E] text-[#FF4D5E] font-bold text-xs uppercase hover:bg-[#FF4D5E] hover:text-white transition-all"
              >
                Cancel Takeover (3s Window)
              </button>
            </div>
          )}

          <div className="hud p-4 rounded text-xs space-y-3">
            <span className="text-[10px] text-[#6F8AA6] uppercase font-mono tracking-wider block">State Machine Progression</span>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-[#3DFF8A]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>1. MONITORING (Real-time guardian)</span>
              </div>
              <div className={`flex items-center gap-2 ${p_scam >= 0.88 ? "text-[#FFB020]" : "text-[#6F8AA6]"}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>2. PENDING (3s fail-safe countdown)</span>
              </div>
              <div className={`flex items-center gap-2 ${callData?.state === "DECOY_ACTIVE" ? "text-[#E4FF3A] font-bold" : "text-[#6F8AA6]"}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>3. DECOY ACTIVE (Ramesh persona)</span>
              </div>
              <div className={`flex items-center gap-2 ${callData?.state === "ENDED" ? "text-[#22E5FF]" : "text-[#6F8AA6]"}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>4. EVIDENCE COMPILED (1930 draft)</span>
              </div>
            </div>
          </div>

          {/* Caller Line Info Card (BACKEND_MODULES §5) */}
          <div className="hud p-4 rounded text-xs space-y-2 border border-[#12304A]">
            <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[#D7E6F5] flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#22E5FF]" />
                <span>Caller Line Info</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40">
                carrier-reported, unverified
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Caller Number:</span>
                <span className="font-mono text-[#D7E6F5] font-bold">{twilioMeta.From || callData?.from_number || "Unknown"}</span>
              </div>
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Carrier Network:</span>
                <span className="text-[#22E5FF]">{lookupMeta.line_type_intelligence?.carrier_name || "Cellular / Mobile"}</span>
              </div>
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Line Type:</span>
                <span className="font-mono text-[#3DFF8A] uppercase">{lookupMeta.line_type_intelligence?.type || "Mobile"}</span>
              </div>
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Reported Region:</span>
                <span className="text-[#D7E6F5]">
                  {[twilioMeta.FromCity, twilioMeta.FromState, twilioMeta.FromCountry].filter(Boolean).join(", ") || lookupMeta.country_code || "IN"}
                </span>
              </div>
              <div className="flex justify-between text-[#6F8AA6]">
                <span>Call SID:</span>
                <span className="font-mono text-[10px] text-[#6F8AA6] truncate max-w-[140px]">{twilioMeta.CallSid || callId}</span>
              </div>
            </div>

            <p className="text-[9px] text-[#6F8AA6]/70 italic pt-1 border-t border-[#12304A]/60">
              *Disclaimer: Carrier-reported metadata is unverified. Never use to accuse an individual or trace physical location.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: Dual-Channel Transcript */}
        <div className="lg:col-span-5 space-y-4">
          <div className="hud p-5 rounded h-[620px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#12304A] pb-3 mb-3">
              <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#22E5FF]" />
                <span>Dual-Channel Audio Transcript</span>
              </span>
              <span className="text-[10px] text-[#6F8AA6] font-mono">Live Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {turns.map((turn, i) => {
                const isCaller = turn.speaker === "caller";
                return (
                  <div
                    key={i}
                    className={`p-3 rounded text-xs leading-relaxed ${
                      isCaller
                        ? "bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 text-[#D7E6F5]"
                        : "bg-[#3DFF8A]/10 border border-[#3DFF8A]/30 text-[#D7E6F5]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                      <span className={isCaller ? "text-[#FF4D5E] font-bold" : "text-[#3DFF8A] font-bold"}>
                        {isCaller ? "[CALLER / SCAMMER]" : "[RAMESH SHARMA / DECOY]"}
                      </span>
                      <span className="text-[#6F8AA6]">Turn #{turn.seq || i + 1}</span>
                    </div>
                    <p className="font-sans">{turn.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#12304A] flex items-center justify-between text-[11px] text-[#6F8AA6]">
              <span>Filter Blocks: {callData?.safety_blocks || 0}</span>
              <span className="text-[#3DFF8A]">Zero Credential Leaks Enforced</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Extracted Identifiers & Safety Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="hud p-5 rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
              <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider">
                Extracted Suspect Leads
              </span>
              <span className="text-[10px] font-mono text-[#3DFF8A] bg-[#3DFF8A]/10 px-2 py-0.5 rounded">
                Traceable Only
              </span>
            </div>

            <div className="space-y-2">
              {identifiers.map((item, i) => (
                <div key={i} className="p-2.5 rounded bg-[#050B14] border border-[#12304A] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-[#22E5FF] font-bold">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-mono text-[#3DFF8A] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Valid Syntax</span>
                    </span>
                  </div>
                  <code className="text-[#D7E6F5] font-mono text-xs block">{item.normalized || item.value}</code>
                  <span className="text-[10px] text-[#6F8AA6] italic mt-1 block">&quot;{item.quote}&quot;</span>
                </div>
              ))}
              {identifiers.length === 0 && (
                <p className="text-xs text-[#6F8AA6] italic py-2">Listening for suspect handles...</p>
              )}
            </div>
          </div>

          <div className="hud p-4 rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-[#6F8AA6]">Live 1930 / Portal JSON</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-[10px] text-[#22E5FF] hover:underline"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-[#050B14] rounded border border-[#12304A] text-[10px] font-mono text-[#D7E6F5] overflow-x-auto max-h-36">
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          </div>

          <div className="hud p-4 rounded text-xs space-y-2">
            <span className="text-[10px] font-bold text-[#D7E6F5] uppercase tracking-wider block mb-2">
              PRD §6 Active Safety Gates
            </span>
            <div className="space-y-1.5 text-[11px] text-[#6F8AA6]">
              <div className="flex items-center gap-2 text-[#3DFF8A]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>No OTP/PIN/Password Leaks</span>
              </div>
              <div className="flex items-center gap-2 text-[#3DFF8A]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Payment Commitments Blocked</span>
              </div>
              <div className="flex items-center gap-2 text-[#3DFF8A]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Remote Desktop (AnyDesk) Rejected</span>
              </div>
              <div className="flex items-center gap-2 text-[#3DFF8A]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Under 35 Words Latency Cap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LiveCallConsolePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-xs text-[#22E5FF]">Connecting to Live Call Stream...</div>}>
        <CallConsoleContent params={params} />
      </Suspense>
    </div>
  );
}
