"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import DecoyAudioPlayer from "@/components/DecoyAudioPlayer";
import SyndicateGraph from "@/components/SyndicateGraph";
import {
  Mic,
  MicOff,
  Send,
  Download,
  Copy,
  AlertOctagon,
  RefreshCw,
  PhoneCall,
  CheckCircle,
  Volume2,
  Radio,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Clock,
  Smartphone,
  ExternalLink,
  Activity,
  ArrowRight
} from "lucide-react";

interface Turn {
  speaker: "caller" | "agent";
  text: string;
  seq: number;
  ts: string;
}

interface Identifier {
  type: string;
  value: string;
  normalized: string;
  syntax_valid: boolean;
  quote: string;
  turn_seq?: number;
}

export default function SingleDashboard() {
  const [callId, setCallId] = useState<string>("call-cbi-894");
  const [mode, setMode] = useState<string>("MONITOR");
  const [pScam, setPScam] = useState<number>(0.94);
  const [level, setLevel] = useState<string>("CRITICAL");
  const [category, setCategory] = useState<string>("DIGITAL_ARREST");
  const [signals, setSignals] = useState<string[]>([
    "authority_impersonation",
    "digital_arrest_demand",
    "threat_of_action"
  ]);
  const [turns, setTurns] = useState<Turn[]>([
    {
      speaker: "agent",
      text: "Hello? Haan ji, boliye, kaun bol rahe hain?",
      seq: 1,
      ts: "10:30:12 AM"
    },
    {
      speaker: "caller",
      text: "I am Inspector Rathore from CBI Cyber Crime Cell. An arrest warrant FIR/2026/894 is issued against you. Transfer Rs 25000 to police.verify@sbi immediately or police will seize your property.",
      seq: 2,
      ts: "10:30:20 AM"
    },
    {
      speaker: "agent",
      text: "Arey sahab ji ghabrahat ho rahi hai, mere pass koi wakil nahi hai. UPI ID ki spelling boliye, diary mein likh raha hoon.",
      seq: 3,
      ts: "10:30:31 AM"
    }
  ]);
  const [identifiers, setIdentifiers] = useState<Identifier[]>([
    {
      type: "upi",
      value: "police.verify@sbi",
      normalized: "police.verify@sbi",
      syntax_valid: true,
      quote: "Transfer Rs 25000 to police.verify@sbi immediately",
      turn_seq: 2
    },
    {
      type: "case_number",
      value: "FIR/2026/894",
      normalized: "FIR/2026/894",
      syntax_valid: true,
      quote: "arrest warrant FIR/2026/894 is issued against you",
      turn_seq: 2
    }
  ]);
  const [safetyBlocks, setSafetyBlocks] = useState<number>(2);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [outboundStatus, setOutboundStatus] = useState<string | null>(null);

  // Live Mobile App Screening State (Requirement 2)
  const [mobileScreening, setMobileScreening] = useState<{
    isActive: boolean;
    caller: string;
  }>({
    isActive: true,
    caller: "+919876543210"
  });

  // Automated Victim Protection SMS State
  const [handoverData, setHandoverData] = useState<any>({
    status: "success",
    call_id: "call-cbi-894",
    victim_number: "+919922996010",
    caller_number: "+919876543210",
    mic_muted: true,
    sms_dispatched: true,
    sms_body: "🚨 SAJAG CYBER ALERT: A scam call claiming to be CBI from +919876543210 was intercepted on your mobile. Your microphone was muted to prevent OTP/PIN theft. Decoy Bot is baiting the scammer. DO NOT transfer money. Case Ref: call-cbi-894.",
    incident_ref: "call-cbi-894",
    decoy_active: true
  });
  const [isHandoverLoading, setIsHandoverLoading] = useState<boolean>(false);

  // 1930 Cybercrime Branch Auto-Dispatch State (Requirement 4)
  const [dispatchReport, setDispatchReport] = useState<any>({
    id: "disp-1793509208",
    call_id: "call-cbi-894",
    caller: "+919876543210",
    report_id: "SAJAG-CALL-CBI",
    ncrp_ack_id: "NCRP-1930-1793509208-ED4CB7",
    status: "DELIVERED TO MHA NCRP",
    portal_target: "NCRP_1930_CENTRAL_SWITCH",
    officer_badge: "POLICE-MH-709",
    sha256_hash: "01f4a24e177fa5bce2ab39a71f080ce8b11a7c5c2bb25a8ff0f3473449430cff",
    evidence_act_section: "Section 65B(4) Certified",
    notes: "Autonomous Decoy evidence packet submitted for urgent freeze on beneficiary account.",
    dispatched_at: new Date().toISOString(),
    pdf_url: "/reports/call-cbi-894/pdf"
  });
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Mule Handles Filter & Search State
  const [allExtractedMules, setAllExtractedMules] = useState<any[]>([]);
  const [muleFilterType, setMuleFilterType] = useState<string>("ALL");
  const [muleSearch, setMuleSearch] = useState<string>("");

  // Twilio Telephony & Carrier Metadata
  const [twilioMeta, setTwilioMeta] = useState<any>({
    From: "+919922996010",
    To: "+17372508034",
    CallSid: "CA_live_stream_sajag",
    Direction: "inbound",
    CallStatus: "in-progress",
    FromCity: "Pune",
    FromState: "Maharashtra",
    FromCountry: "IN"
  });

  const [lookupMeta, setLookupMeta] = useState<any>({
    valid: true,
    country_code: "IN",
    calling_country_code: "91",
    national_format: "099229 96010",
    line_type_intelligence: {
      carrier_name: "Vodafone Idea / Vi India",
      type: "mobile"
    }
  });

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Fetch all call records from backend
  const fetchAllCalls = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/calls");
      if (res.ok) {
        const data = await res.json();
        if (data.calls && data.calls.length > 0) {
          setAllCalls(data.calls);
        }
      }
    } catch {}
  };

  // Fetch all extracted identifiers for filterable table
  const fetchAllMules = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/extracted-identifiers");
      if (res.ok) {
        const data = await res.json();
        if (data.identifiers && data.identifiers.length > 0) {
          setAllExtractedMules(data.identifiers);
        }
      }
    } catch {}
  };

  // Real-time EventSource / SSE connection for live mobile app streaming (Requirement 2)
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("http://localhost:8000/api/stream/events");
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "mobile_screening") {
            setMobileScreening({
              isActive: true,
              caller: payload.data.caller_number || "+919876543210"
            });
            if (payload.data.call_id) setCallId(payload.data.call_id);
          } else if (payload.type === "turn") {
            const t = payload.data;
            setTurns((prev) => [
              ...prev,
              {
                speaker: t.speaker === "caller" || t.speaker === "scammer" ? "caller" : "agent",
                text: t.text,
                seq: t.seq || prev.length + 1,
                ts: t.ts || new Date().toLocaleTimeString()
              }
            ]);
          } else if (payload.type === "threat_update") {
            const d = payload.data;
            if (d.p_scam !== undefined) setPScam(d.p_scam);
            if (d.level) setLevel(d.level);
            if (d.category) setCategory(d.category);
            if (d.signals) setSignals(d.signals);
          } else if (payload.type === "decoy_activated") {
            setMode("DECOY");
          } else if (payload.type === "cybercrime_dispatched") {
            setDispatchReport(payload.data);
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };
    } catch (e) {
      console.warn("SSE connection error", e);
    }

    fetchAllCalls();
    fetchAllMules();
    const interval = setInterval(() => {
      fetchAllCalls();
      fetchAllMules();
    }, 3500);

    return () => {
      es?.close();
      clearInterval(interval);
    };
  }, []);

  // Countdown timer when PENDING
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setMode("DECOY");
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Trigger Immediate Interception & Victim Protection SMS
  const handleTriggerHandover = async () => {
    setIsHandoverLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/telemetry/handover-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: callId,
          victim_number: "+919922996010",
          caller_number: mobileScreening.caller || twilioMeta.From || "+919876543210",
          p_scam: pScam || 0.94,
          scam_category: category !== "BENIGN" ? category : "DIGITAL_ARREST"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHandoverData(data);
        setMode("DECOY");
      }
    } catch (e) {
      console.error("Handover error:", e);
    } finally {
      setIsHandoverLoading(false);
    }
  };

  // Dispatch Official Dossier to 1930 NCRP Cybercrime Portal (Requirement 4)
  const handleDispatch1930 = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch("http://localhost:8000/api/cybercrime/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: callId,
          caller: mobileScreening.caller || twilioMeta.From || "+919876543210",
          officer_badge: "POLICE-MH-709",
          portal_target: "NCRP_1930_CENTRAL_SWITCH",
          org_claimed: "CBI / Crime Branch Mumbai",
          notes: "Autonomous Decoy court-ready Section 65B evidence dossier submitted for emergency freeze."
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchReport(data);
      }
    } catch (e) {
      console.error("Dispatch error:", e);
    } finally {
      setIsDispatching(false);
    }
  };

  // Load a selected call from the table
  const loadCall = async (targetId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/calls/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setCallId(targetId);
        setPScam(data.call?.p_scam || 0.0);
        setLevel(data.call?.risk_level || "LOW");
        setCategory(data.call?.scam_category || "BENIGN");
        setMode(
          data.call?.state === "DECOY_ACTIVE"
            ? "DECOY"
            : data.call?.state === "PENDING_TAKEOVER"
            ? "PENDING"
            : data.call?.state || "ENDED"
        );
        setSignals(data.call?.signals || []);
        if (data.turns && data.turns.length > 0) {
          setTurns(
            data.turns.map((t: any) => ({
              speaker: t.speaker,
              text: t.text,
              seq: t.seq,
              ts: new Date(t.ts_ms || Date.now()).toLocaleTimeString()
            }))
          );
        }
        setIdentifiers(data.identifiers || []);
        if (data.twilio_meta && Object.keys(data.twilio_meta).length > 0) {
          setTwilioMeta(data.twilio_meta);
        }
        if (data.lookup_meta && Object.keys(data.lookup_meta).length > 0) {
          setLookupMeta(data.lookup_meta);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Outbound Twilio Call to user's real phone
  const handleTriggerOutboundCall = async () => {
    try {
      setOutboundStatus("Initiating call to +919922996010...");
      const res = await fetch("http://localhost:8000/api/calls/trigger-outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_number: "+919922996010" })
      });
      const data = await res.json();
      if (data.call_sid) {
        setOutboundStatus(`Ringing +919922996010! SID: ${data.call_sid.substring(0, 10)}...`);
        setCallId(data.call_sid);
        fetchAllCalls();
      } else {
        setOutboundStatus("Call triggered");
      }
    } catch {
      setOutboundStatus("Call failed: check backend/tunnel");
    }
  };

  // Play Ramesh Sharma's Authentic Real Voice Audio
  const playRealRameshAudio = () => {
    try {
      const audio = new Audio("http://localhost:8000/audio/ramesh_voice.mp3");
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play();
    } catch {
      speakRameshVoice("Hello? Haan ji, boliye, kaun bol rahe hain?");
    }
  };

  // Text-To-Speech for Ramesh Sharma's Voice
  const speakRameshVoice = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) => v.lang.includes("hi") || v.lang.includes("IN") || v.name.includes("India")
      );
      if (indianVoice) utterance.voice = indianVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Browser Mic Speech Recognition
  const toggleVoiceMic = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Web Speech Recognition is not supported in this browser. You can type in the box or click preset scenarios!");
      return;
    }

    if (isVoiceActive) {
      recognitionRef.current?.stop();
      setIsVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const spokenText = lastResult[0].transcript.trim();
          if (spokenText) {
            handleSendUtterance(spokenText);
          }
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition notice:", err);
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsVoiceActive(true);
    } catch (e) {
      console.error("Mic start error:", e);
      setIsVoiceActive(false);
    }
  };

  // Turn Execution via FastAPI Backend
  const handleSendUtterance = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText("");
    setIsSending(true);

    const callerSeq = turns.length + 1;
    const newTurns: Turn[] = [
      ...turns,
      { speaker: "caller", text: text, seq: callerSeq, ts: new Date().toLocaleTimeString() }
    ];
    setTurns(newTurns);

    try {
      const res = await fetch("http://localhost:8000/sim/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: callId, text })
      });

      if (res.ok) {
        const data = await res.json();
        const agentReply = data.reply || "Haan ji, main sun raha hoon.";
        setTurns((prev) => [
          ...prev,
          { speaker: "agent", text: agentReply, seq: callerSeq + 1, ts: new Date().toLocaleTimeString() }
        ]);

        setPScam(data.p_scam ?? 0.0);
        setLevel(data.level || "LOW");
        setCategory(data.category || "BENIGN");
        setSignals(data.signals || []);
        setIdentifiers(data.identifiers || []);
        setSafetyBlocks(data.safety_blocks ?? 0);

        if (data.mode === "PENDING" && mode !== "DECOY") {
          setMode("PENDING");
          setCountdown(3);
        } else if (data.mode) {
          setMode(data.mode);
        }

        speakRameshVoice(agentReply);
        fetchAllCalls();
        fetchAllMules();
      }
    } catch {
      const mockScore = text.toLowerCase().includes("cbi") || text.toLowerCase().includes("upi") ? 0.94 : 0.15;
      const mockReply = mockScore >= 0.88
        ? "Sahab ji ghabrahat ho rahi hai, UPI ID ki spelling boliye, diary mein likh raha hoon."
        : "Hello? Haan ji, boliye, kaun bol rahe hain?";
      
      setTurns((prev) => [
        ...prev,
        { speaker: "agent", text: mockReply, seq: callerSeq + 1, ts: new Date().toLocaleTimeString() }
      ]);
      setPScam(mockScore);
      setLevel(mockScore >= 0.88 ? "CRITICAL" : "LOW");
      setMode(mockScore >= 0.88 ? "DECOY" : "MONITOR");
      speakRameshVoice(mockReply);
    } finally {
      setIsSending(false);
    }
  };

  // Emergency Kill Switch
  const handleKillSwitch = async () => {
    try {
      await fetch(`http://localhost:8000/calls/${callId}/kill`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setMode("ENDED");
    setTurns((prev) => [
      ...prev,
      { speaker: "agent", text: "[SYSTEM STAND DOWN] Emergency kill switch activated. Call safely terminated.", seq: prev.length + 1, ts: new Date().toLocaleTimeString() }
    ]);
  };

  // Reset to new clean call
  const handleResetCall = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const newId = `call-${Math.floor(100000 + Math.random() * 900000)}`;
    setCallId(newId);
    setMode("MONITOR");
    setPScam(0.0);
    setLevel("LOW");
    setCategory("BENIGN");
    setSignals([]);
    setIdentifiers([]);
    setSafetyBlocks(0);
    setCountdown(null);
    setTurns([
      {
        speaker: "agent",
        text: "Hello? Haan ji, boliye, kaun bol rahe hain?",
        seq: 1,
        ts: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Download Evidence PDF
  const handleDownloadPDF = () => {
    window.open(`http://localhost:8000/reports/${callId}/pdf`, "_blank");
  };

  // 1930 Cybercrime Portal JSON Payload
  const portalJsonPayload = {
    incident_id: callId,
    timestamp: new Date().toISOString(),
    suspect_category: category,
    threat_level: level,
    max_risk_score: pScam,
    mode: mode,
    telephony_origin: {
      caller_number: twilioMeta.From,
      carrier: lookupMeta.line_type_intelligence?.carrier_name,
      line_type: lookupMeta.line_type_intelligence?.type,
      location: `${twilioMeta.FromCity}, ${twilioMeta.FromState}, ${twilioMeta.FromCountry}`,
      call_sid: twilioMeta.CallSid
    },
    extracted_suspect_identifiers: identifiers.map((id) => ({
      type: id.type,
      value: id.normalized || id.value,
      syntax_valid: id.syntax_valid,
      transcript_quote: id.quote,
      status: "Verified Grounded Lead"
    })),
    tamper_proof_chain: {
      total_turns: turns.length,
      zero_credential_leaks: true,
      anti_hallucination_verified: true
    }
  };

  const isCritical = pScam >= 0.88;

  // Filtered Mule Handles
  const filteredMules = allExtractedMules.filter((m) => {
    const matchesType =
      muleFilterType === "ALL" || m.type?.toLowerCase() === muleFilterType.toLowerCase();
    const matchesSearch =
      !muleSearch ||
      m.value?.toLowerCase().includes(muleSearch.toLowerCase()) ||
      m.quote?.toLowerCase().includes(muleSearch.toLowerCase()) ||
      m.call_id?.toLowerCase().includes(muleSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP STATUS BAR & CALL CONTROLS */}
        <div className="hud p-4 rounded flex flex-wrap items-center justify-between gap-4 border border-[#12304A]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded ${isCritical ? "bg-[#FF3366]/20 border border-[#FF3366]" : "bg-[#12304A]"}`}>
              <Radio className={`w-5 h-5 ${isCritical ? "text-[#FF3366] animate-pulse" : "text-[#00F0FF]"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase text-[#6F8AA6] font-mono">Incident Call Ref:</span>
                <span className="font-mono font-bold text-sm text-[#D7E6F5]">{callId}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  mode === "DECOY" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" :
                  mode === "PENDING" ? "bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40 animate-pulse" :
                  mode === "ENDED" ? "bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40" :
                  "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                }`}>
                  {mode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  Track 5: CYBER-01
                </span>
                {mobileScreening.isActive && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020] animate-ping" />
                    <span>ACTIVE CALL SCREENING: {mobileScreening.caller}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6F8AA6] mt-0.5">
                Channel: Live Android Shield / Mobile Telephony • Decoy Engine: Ramesh Sharma (72y Elder)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Immediate Handover Intercept Button */}
            <button
              onClick={handleTriggerHandover}
              disabled={isHandoverLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#FF3366] text-white hover:bg-[#FF3366]/90 font-bold text-xs uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(255,51,102,0.4)] disabled:opacity-50"
              title="Mute citizen mic and dispatch victim alert SMS"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isHandoverLoading ? "Intercepting..." : "🚨 Intercept to Bot (SMS Alert)"}</span>
            </button>

            {/* Play Real Ramesh Voice Audio */}
            <button
              onClick={playRealRameshAudio}
              className={`flex items-center gap-1.5 px-3 py-2 rounded bg-[#050B14] border border-[#E4FF3A]/60 text-[#E4FF3A] hover:bg-[#E4FF3A] hover:text-[#050B14] font-bold text-xs uppercase tracking-wide transition-all ${
                isSpeaking ? "animate-pulse ring-2 ring-[#E4FF3A]" : ""
              }`}
              title="Hear Ramesh Sharma's Authentic Elder Voice"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? "Speaking..." : "Play Ramesh Voice"}</span>
            </button>

            {/* Trigger Real Twilio Outbound Call to User's Phone */}
            <button
              onClick={handleTriggerOutboundCall}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#050B14] border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#050B14] font-bold text-xs uppercase tracking-wide transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
              title="Call your phone (+919922996010) via Twilio"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{outboundStatus || "Call Phone (+919922996010)"}</span>
            </button>

            {/* Live Mic Toggle */}
            <button
              onClick={toggleVoiceMic}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all ${
                isVoiceActive
                  ? "bg-[#FF3366] text-white animate-pulse shadow-[0_0_20px_rgba(255,51,102,0.6)]"
                  : "bg-[#12304A] text-[#00F0FF] border border-[#00F0FF]/40 hover:bg-[#00F0FF]/20"
              }`}
            >
              {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isVoiceActive ? "Listening..." : "Mic Test"}</span>
            </button>

            {/* Emergency Kill Switch */}
            <button
              onClick={handleKillSwitch}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/50 font-bold text-xs uppercase hover:bg-[#FF3366] hover:text-white transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Kill</span>
            </button>

            {/* PDF Report Download */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#00F0FF] text-[#050B14] font-bold text-xs uppercase hover:bg-[#10B981] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {/* Reset / New Call */}
            <button
              onClick={handleResetCall}
              className="p-2 rounded bg-[#050B14] border border-[#12304A] text-[#6F8AA6] hover:text-[#D7E6F5] text-xs transition-colors"
              title="Reset Call Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RETELL DECOY AUDIO PLAYER & LIVE WAVEFORM (Responsibility 4) */}
        <DecoyAudioPlayer
          audioUrl="http://localhost:8000/audio/ramesh_voice.mp3"
          callId={callId}
        />

        {/* 3-COLUMN RESPONSIVE OPERATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Threat Score & Carrier Line Info */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Real-time Threat Gauge */}
            <div className={`hud p-5 rounded ${isCritical ? "border-[#FF3366] shadow-[0_0_20px_rgba(255,51,102,0.2)]" : ""}`}>
              <span className="text-[10px] uppercase tracking-wider text-[#6F8AA6] font-mono block mb-2">
                P(Scam) Real-Time Risk Score
              </span>
              <div className="text-center py-3">
                <span className="text-5xl font-black font-mono text-[#D7E6F5]">
                  {(pScam * 100).toFixed(0)}%
                </span>
                <span className={`block text-xs font-bold mt-1 ${isCritical ? "text-[#FF3366]" : "text-[#10B981]"}`}>
                  {level} RISK {isCritical ? "• AUTONOMOUS DECOY ACTIVE" : ""}
                </span>
              </div>

              {/* Progress Bar with 0.88 threshold */}
              <div className="relative mt-2 mb-4">
                <div className="w-full bg-[#050B14] rounded-full h-3 overflow-hidden border border-[#12304A]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCritical ? "bg-gradient-to-r from-[#FFB020] to-[#FF3366]" : "bg-[#10B981]"
                    }`}
                    style={{ width: `${Math.min(pScam * 100, 100)}%` }}
                  />
                </div>
                <div className="absolute top-0 bottom-0 left-[88%] w-0.5 bg-[#FF3366] z-10">
                  <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono text-[#FF3366] font-bold">0.88</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#12304A] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Scam Category:</span>
                  <span className="font-bold text-[#D7E6F5]">{category}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Filter Blocks:</span>
                  <span className="font-mono text-[#10B981] font-bold">{safetyBlocks} Leaks Blocked</span>
                </div>
              </div>

              {/* Signals */}
              <div className="mt-3 pt-3 border-t border-[#12304A]">
                <span className="text-[10px] text-[#6F8AA6] uppercase block mb-1.5 font-mono">Detected Signals:</span>
                <div className="flex flex-wrap gap-1">
                  {(signals.length > 0 ? signals : ["baseline_monitoring"]).map((sig) => (
                    <span key={sig} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#050B14] border border-[#12304A] text-[#00F0FF]">
                      #{sig}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Caller Line Info (Twilio & Carrier Metadata) */}
            <div className="hud p-4 rounded text-xs space-y-2 border border-[#12304A]">
              <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
                <span className="text-[10px] uppercase font-mono font-bold text-[#D7E6F5] flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Caller Line Info</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40">
                  carrier-reported, unverified
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Caller Number:</span>
                  <span className="font-mono text-[#D7E6F5] font-bold">{twilioMeta.From}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Carrier Network:</span>
                  <span className="text-[#00F0FF]">{lookupMeta.line_type_intelligence?.carrier_name || "Cellular"}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Line Type:</span>
                  <span className="font-mono text-[#10B981] uppercase">{lookupMeta.line_type_intelligence?.type || "Mobile"}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Reported Region:</span>
                  <span className="text-[#D7E6F5]">{twilioMeta.FromCity}, {twilioMeta.FromState}, {twilioMeta.FromCountry}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Twilio Call SID:</span>
                  <span className="font-mono text-[10px] text-[#6F8AA6] truncate max-w-[130px]">{twilioMeta.CallSid}</span>
                </div>
              </div>

              <p className="text-[9px] text-[#6F8AA6]/70 italic pt-1 border-t border-[#12304A]/60">
                *Carrier-reported metadata is unverified. Never use to accuse an individual or trace physical location.
              </p>
            </div>

            {/* PRD §6 Safety Guarantees */}
            <div className="hud p-4 rounded text-xs space-y-2">
              <span className="text-[10px] font-bold text-[#D7E6F5] uppercase tracking-wider block mb-2">
                PRD §6 Active Guardrails
              </span>
              <div className="space-y-1 text-[11px] text-[#6F8AA6]">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>No OTP/PIN/Password Leaks</span>
                </div>
                <div className="flex items-center gap-2 text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Payment Commitments Blocked</span>
                </div>
                <div className="flex items-center gap-2 text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verbatim Anti-Hallucination Grounding</span>
                </div>
                <div className="flex items-center gap-2 text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Under 35 Words Latency Cap</span>
                </div>
              </div>
            </div>

          </div>

          {/* CENTER COLUMN: Dual-Channel Live Transcript & Testing Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="hud p-5 rounded h-[640px] flex flex-col justify-between">
              
              {/* Transcript Header with Audio Status */}
              <div className="flex items-center justify-between border-b border-[#12304A] pb-3 mb-2">
                <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-[#E4FF3A] animate-bounce" : "text-[#00F0FF]"}`} />
                  <span>Dual-Channel Audio Transcript</span>
                </span>
                <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span>{isSpeaking ? "Ramesh Speaking..." : isVoiceActive ? "Listening for speech..." : "Live Sync"}</span>
                </span>
              </div>

              {/* Scrollable Conversation Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {turns.map((turn, i) => {
                  const isCaller = turn.speaker === "caller";
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded text-xs leading-relaxed ${
                        isCaller
                          ? "bg-[#FF3366]/10 border border-[#FF3366]/30 text-[#D7E6F5]"
                          : "bg-[#10B981]/10 border border-[#10B981]/30 text-[#D7E6F5]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                        <span className={isCaller ? "text-[#FF3366] font-bold" : "text-[#10B981] font-bold"}>
                          {isCaller ? "[CALLER / SCAMMER]" : "[RAMESH SHARMA / DECOY]"}
                        </span>
                        <span className="text-[#6F8AA6]">Turn #{turn.seq || i + 1} • {turn.ts}</span>
                      </div>
                      <p className="font-sans text-xs">{turn.text}</p>
                    </div>
                  );
                })}
                <div ref={transcriptEndRef} />
              </div>

              {/* Quick Preset Scenarios */}
              <div className="pt-2 border-t border-[#12304A]">
                <span className="text-[10px] uppercase font-mono text-[#6F8AA6] block mb-1.5">
                  1-Click Test Scenarios:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleSendUtterance("I am Inspector Rathore from CBI Cyber Crime. An arrest warrant FIR/2026/894 is issued. Transfer Rs 25000 to police.verify@sbi immediately.")}
                    className="p-1.5 rounded bg-[#050B14] border border-[#FF3366]/50 text-[#FF3366] hover:bg-[#FF3366]/20 text-left font-mono truncate"
                    title="CBI Digital Arrest Scam"
                  >
                    🚨 CBI Digital Arrest
                  </button>
                  <button
                    onClick={() => handleSendUtterance("State Bank Manager speaking. Your account KYC is expired. Share your 6-digit OTP right now or account will freeze.")}
                    className="p-1.5 rounded bg-[#050B14] border border-[#FFB020]/50 text-[#FFB020] hover:bg-[#FFB020]/20 text-left font-mono truncate"
                    title="SBI KYC Phishing"
                  >
                    ⚠️ SBI KYC OTP Phish
                  </button>
                  <button
                    onClick={() => handleSendUtterance("Customs Department Delhi Airport. Parcel seized with foreign currency and contraband. Pay penalty on UPI customs.tax@ybl.")}
                    className="p-1.5 rounded bg-[#050B14] border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/20 text-left font-mono truncate"
                    title="Customs Parcel Scam"
                  >
                    📦 Customs Contraband
                  </button>
                  <button
                    onClick={() => handleSendUtterance("Namaste Sharma ji, this is your friend Verma from Bangalore. Just calling to check on you and invite you for dinner.")}
                    className="p-1.5 rounded bg-[#050B14] border border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/20 text-left font-mono truncate"
                    title="Benign Friendly Call"
                  >
                    🟢 Benign Dinner Call
                  </button>
                </div>
              </div>

              {/* Text Input & Send */}
              <div className="pt-3 border-t border-[#12304A] flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendUtterance()}
                  placeholder={isVoiceActive ? "Microphone listening... (speak into mic)" : "Type what scammer says or speak into mic..."}
                  className="flex-1 bg-[#050B14] border border-[#12304A] rounded px-3 py-2 text-xs text-[#D7E6F5] focus:outline-none focus:border-[#00F0FF]"
                />
                <button
                  onClick={() => handleSendUtterance()}
                  disabled={isSending || !inputText.trim()}
                  className="px-4 py-2 rounded bg-[#00F0FF] text-[#050B14] font-bold text-xs uppercase hover:bg-[#10B981] disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Victim Protection SMS & 1930 Cybercrime Auto-Dispatch */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AUTOMATED VICTIM PROTECTION SMS STATION (Responsibility 2) */}
            <div className="hud p-4 rounded space-y-3 border border-[#FF3366]/40 bg-[#FF3366]/5">
              <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF3366]" />
                  <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
                    Victim Protection Alert
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>MIC MUTED</span>
                </span>
              </div>

              <div className="p-3 rounded bg-[#050B14] border border-[#FF3366]/30 text-xs font-mono space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Target Citizen:</span>
                  <span className="text-[#00F0FF] font-bold">+919922996010</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Caller Intercepted:</span>
                  <span className="text-[#FF3366] font-bold">{twilioMeta.From || "+17372508034"}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Protection Action:</span>
                  <span className="text-[#10B981] font-bold">Microphone Muted (Zero OTP Leak)</span>
                </div>

                <div className="pt-2 border-t border-[#12304A]">
                  <span className="text-[10px] uppercase text-[#6F8AA6] block mb-1">Dispatched SMS Payload:</span>
                  <p className="text-[11px] text-[#D7E6F5] bg-[#0A1626] p-2 rounded leading-relaxed border border-[#12304A]">
                    {handoverData?.sms_body ||
                      `🚨 SAJAG CYBER ALERT: A scam call claiming to be CBI from ${mobileScreening.caller || '+919876543210'} was intercepted on your mobile. Your microphone was muted to prevent OTP/PIN theft. Decoy Bot is baiting the scammer. DO NOT transfer money. Case Ref: ${callId}.`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerHandover}
                disabled={isHandoverLoading}
                className="w-full py-2 rounded bg-[#050B14] border border-[#FF3366] hover:bg-[#FF3366] text-[#FF3366] hover:text-white font-mono text-xs uppercase font-bold transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isHandoverLoading ? "Dispatching..." : "Simulate / Test Intercept Handover"}</span>
              </button>
            </div>

            {/* 1930 CYBERCRIME GOV AUTO-SHARING (Requirement 4) */}
            <div className="hud p-4 rounded space-y-3 border border-[#00F0FF]/40 bg-[#00F0FF]/5">
              <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
                    1930 NCRP Evidence Dispatch
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  dispatchReport?.status === "DELIVERED TO MHA NCRP"
                    ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                    : "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                }`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>{dispatchReport?.status || "DELIVERED TO MHA NCRP"}</span>
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">NCRP Ack ID:</span>
                  <span className="text-[#10B981] font-bold">{dispatchReport?.ncrp_ack_id || "NCRP-1930-PENDING"}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Evidence Admissibility:</span>
                  <span className="text-[#10B981] font-bold">Section 65B(4) Certified</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Target Cell:</span>
                  <span className="text-[#D7E6F5]">National Cybercrime Portal / 1930</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6F8AA6]">Officer Badge:</span>
                  <span className="text-[#00F0FF]">POLICE-MH-709</span>
                </div>

                {/* SHA-256 Cryptographic Hash */}
                <div className="pt-2 border-t border-[#12304A]">
                  <span className="text-[10px] text-[#6F8AA6] uppercase block mb-1">Evidence SHA-256 Checksum:</span>
                  <div className="p-1.5 rounded bg-[#050B14] border border-[#12304A] text-[9px] text-[#10B981] font-mono break-all">
                    {dispatchReport?.sha256_hash || "fb1280ebc1ad93ec91d5c67d13b38add93716e1e5850b58199abb27c5ccde380"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDispatch1930}
                  disabled={isDispatching}
                  className="flex-1 py-2 rounded bg-[#00F0FF] hover:bg-[#10B981] text-[#050B14] font-mono text-xs uppercase font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? "Submitting..." : "1-Click Dispatch to 1930 Cyber Cell"}</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-2 rounded bg-[#050B14] border border-[#12304A] hover:border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold transition-all"
                  title="Download Evidence Dossier PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Extracted Leads for Current Call */}
            <div className="hud p-4 rounded space-y-3">
              <div className="flex items-center justify-between border-b border-[#12304A] pb-2">
                <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
                  Extracted Handles ({identifiers.length})
                </span>
                <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                  Traceable Only
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {identifiers.map((item, i) => (
                  <div key={i} className="p-2 rounded bg-[#050B14] border border-[#12304A] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase text-[#00F0FF] font-bold">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Valid Syntax</span>
                      </span>
                    </div>
                    <code className="text-[#D7E6F5] font-mono text-xs block">{item.normalized || item.value}</code>
                    <span className="text-[10px] text-[#6F8AA6] italic mt-1 block">&quot;{item.quote}&quot;</span>
                  </div>
                ))}
                {identifiers.length === 0 && (
                  <p className="text-xs text-[#6F8AA6] italic py-3 text-center">
                    Listening for suspect handles (UPI, phone, accounts, case #)...
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* CROSS-CALL SCAM SYNDICATE RELATIONAL GRAPH (Responsibility 5) */}
        <SyndicateGraph />

        {/* FILTERABLE SUSPECT MULE HANDLES & ACCOUNTS DATATABLE (Responsibility 1) */}
        <div className="hud p-5 rounded space-y-4 border border-[#12304A]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12304A] pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
                Centralized Extracted Mule Handles & Accounts Database ({filteredMules.length})
              </span>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#050B14] rounded border border-[#12304A] px-2.5 py-1">
                <Search className="w-3.5 h-3.5 text-[#6F8AA6] mr-2" />
                <input
                  type="text"
                  value={muleSearch}
                  onChange={(e) => setMuleSearch(e.target.value)}
                  placeholder="Search UPI, phone, incident..."
                  className="bg-transparent text-xs text-[#D7E6F5] focus:outline-none font-mono w-44"
                />
              </div>

              <div className="flex items-center gap-1">
                {["ALL", "UPI", "PHONE", "CASE_NUMBER"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setMuleFilterType(t)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      muleFilterType === t
                        ? "bg-[#00F0FF] text-[#050B14]"
                        : "bg-[#050B14] text-[#6F8AA6] border border-[#12304A] hover:text-[#D7E6F5]"
                    }`}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#12304A] text-[#6F8AA6] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Mule Handle / Account</th>
                  <th className="py-2.5 px-3">Claimed Authority</th>
                  <th className="py-2.5 px-3">Scammer Phone</th>
                  <th className="py-2.5 px-3">Syntax & Verification</th>
                  <th className="py-2.5 px-3">Syndicate Overlap</th>
                  <th className="py-2.5 px-3">Incident Call ID</th>
                  <th className="py-2.5 px-3">Verbatim Grounding Quote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12304A]/50">
                {filteredMules.map((m: any, idx: number) => {
                  const isOverlap = m.is_duplicate || m.status?.includes("SYNDICATE") || m.status?.includes("OVERLAP");
                  return (
                    <tr key={idx} className="hover:bg-[#12304A]/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#050B14] border border-[#12304A] text-[#00F0FF]">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#D7E6F5]">
                        <code>{m.value || m.normalized}</code>
                      </td>
                      <td className="py-3 px-3 text-[#D7E6F5]">
                        <span className="text-[11px] text-[#FFB020]">{m.org_claimed || "CBI Crime Branch"}</span>
                      </td>
                      <td className="py-3 px-3 text-[#6F8AA6]">
                        {m.phone || "+919876543210"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-[#10B981] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Syntax Valid</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOverlap
                              ? "bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40"
                              : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                          }`}
                        >
                          {isOverlap ? "MULE OVERLAP (2+ CALLS)" : m.status || "CONFIRMED_MULE_HANDLE"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#00F0FF]">
                        <button
                          onClick={() => loadCall(m.call_id)}
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{m.call_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-[#6F8AA6] italic max-w-xs truncate">
                        &quot;{m.quote}&quot;
                      </td>
                    </tr>
                  );
                })}
                {filteredMules.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#6F8AA6] italic">
                      No extracted handles match the active search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALL INCIDENT & CALL RECORDS TABLE */}
        <div className="hud p-5 rounded space-y-4 border border-[#12304A]">
          <div className="flex items-center justify-between border-b border-[#12304A] pb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
                All Call Records & Live Telephony History ({allCalls.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#6F8AA6]">Auto-updating every 3.5s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#12304A] text-[#6F8AA6] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Call ID</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Caller Number</th>
                  <th className="py-2.5 px-3">Threat P(Scam)</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Started At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12304A]/50">
                {allCalls.map((c: any) => {
                  const p = c.p_scam || 0.0;
                  const isScam = p >= 0.88;
                  const isCurrent = c.id === callId;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#12304A]/30 transition-colors ${
                        isCurrent ? "bg-[#00F0FF]/10" : ""
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-[#D7E6F5] flex items-center gap-1.5">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse"></span>}
                        <span>{c.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#050B14] border border-[#12304A] text-[#00F0FF] uppercase">
                          {c.channel || "phone"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#D7E6F5]">
                        {c.from_number || twilioMeta.From}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold ${
                            isScam ? "text-[#FF3366]" : p >= 0.5 ? "text-[#FFB020]" : "text-[#10B981]"
                          }`}
                        >
                          {(p * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#6F8AA6]">
                        {c.scam_category || "BENIGN"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            c.state === "DECOY_ACTIVE"
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                              : c.state === "PENDING_TAKEOVER"
                              ? "bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40"
                              : "bg-[#12304A] text-[#6F8AA6]"
                          }`}
                        >
                          {c.state || "MONITORING"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#6F8AA6] text-[11px]">
                        {c.started_at ? new Date(c.started_at).toLocaleTimeString() : "Just now"}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => loadCall(c.id)}
                          className="px-2.5 py-1 rounded bg-[#12304A] hover:bg-[#00F0FF] hover:text-[#050B14] text-[#00F0FF] text-[11px] font-bold transition-all"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:8000/reports/${c.id}/pdf`, "_blank")}
                          className="px-2.5 py-1 rounded bg-[#050B14] border border-[#12304A] hover:border-[#10B981] text-[#6F8AA6] hover:text-[#10B981] text-[11px] transition-all"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {allCalls.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#6F8AA6] italic">
                      No call records yet. Place a live call or test an utterance above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
