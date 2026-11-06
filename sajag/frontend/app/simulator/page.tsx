"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  Play, 
  Send, 
  Mic, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Radio, 
  ExternalLink 
} from "lucide-react";

export default function SimulatorPage() {
  const [callId, setCallId] = useState("sim-100234");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [latestState, setLatestState] = useState<any>(null);
  const [webCallActive, setWebCallActive] = useState(false);

  const presets = [
    {
      title: "CBI Digital Arrest",
      text: "I am Inspector Rathore from CBI Cyber Crime Cell Delhi. An arrest warrant FIR/CBI/2026/894 has been issued in your name for illegal money laundering. Transfer 25000 to verification UPI police.verify@sbi immediately or face arrest.",
      category: "Scam"
    },
    {
      title: "TRAI SIM Deactivation",
      text: "TRAI urgent alert: Your mobile number will be disconnected within 2 hours due to illegal activity. Transfer 500 rupees reactivate fee to trai.dept@ybl right now.",
      category: "Scam"
    },
    {
      title: "Fake KYC OTP Trap",
      text: "State Bank officer here. Your debit card KYC is expired and account blocked. Tell me the 6 digit OTP you just received immediately to avoid permanent freeze.",
      category: "Scam"
    },
    {
      title: "Benign: Bank Balance",
      text: "Namaste Sharma ji, this is State Bank automated balance enquiry. Your savings account balance is 24500 rupees. No action required.",
      category: "Benign"
    },
    {
      title: "Benign: Police Outreach",
      text: "Namaste uncle, local police station se Constable Patil bol raha hoon. Area mein senior citizens verification drive chal rahi hai, kal subah 10 baje form bharne aayenge.",
      category: "Benign"
    }
  ];

  const handleSendTurn = async (textToSend: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setLoading(true);
    const newCallerTurn = { role: "caller", text };
    setHistory((prev) => [...prev, newCallerTurn]);
    setInputText("");

    try {
      const res = await fetch("http://localhost:8000/sim/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: callId, text }),
      });
      const data = await res.json();
      setLatestState(data);
      setHistory((prev) => [...prev, { role: "agent", text: data.reply }]);
    } catch {
      // Fallback local mock simulation
      const mockScore = text.toLowerCase().includes("cbi") ? 0.95 : 0.1;
      const mockReply = mockScore > 0.8
        ? "Sahab ji ghabrahat ho rahi hai, UPI ID ki spelling boliye, diary mein likh raha hoon."
        : "Hello? Haan ji, boliye, kaun bol rahe hain?";
      setLatestState({
        call_id: callId,
        p_scam: mockScore,
        level: mockScore > 0.8 ? "CRITICAL" : "LOW",
        mode: mockScore > 0.8 ? "DECOY" : "MONITOR",
        category: mockScore > 0.8 ? "DIGITAL_ARREST" : "BENIGN",
        signals: mockScore > 0.8 ? ["authority", "threat", "demand"] : [],
        identifiers: mockScore > 0.8 ? [{ type: "upi", normalized: "police.verify@sbi", syntax_valid: true }] : []
      });
      setHistory((prev) => [...prev, { role: "agent", text: mockReply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWebCall = async () => {
    try {
      const res = await fetch("http://localhost:8000/web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setWebCallActive(true);
      alert(`Web call token created: ${data.call_id || "demo-call"}. Retell Web Client ready.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setCallId(`sim-${Date.now().toString().slice(-6)}`);
    setHistory([]);
    setLatestState(null);
  };

  const p_scam = latestState?.p_scam || 0.0;
  const isCritical = p_scam >= 0.88;

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
          <div>
            <span className="text-xs text-[#22E5FF] uppercase font-mono tracking-widest">Interactive Testing Sandbox</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
              Scammer Simulator & <span className="grad">Web Call Bridge</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartWebCall}
              className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(61,255,138,0.3)] ${
                webCallActive
                  ? "bg-[#3DFF8A] text-[#050B14]"
                  : "bg-[#0A1626] border border-[#3DFF8A] text-[#3DFF8A] hover:bg-[#3DFF8A]/10"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{webCallActive ? "Microphone Live" : "Start Retell Web Call"}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#0A1626] border border-[#12304A] text-xs text-[#6F8AA6] hover:text-[#22E5FF]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Session</span>
            </button>

            {latestState && (
              <a
                href={`/calls/${callId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#12304A] text-[#22E5FF] font-bold text-xs hover:bg-[#22E5FF] hover:text-[#050B14] transition-all"
              >
                <span>Live Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Preset Scenarios */}
        <div className="hud p-4 rounded space-y-2">
          <span className="text-xs font-bold text-[#6F8AA6] uppercase tracking-wider block font-mono">
            Load Pre-Engineered Scenario Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isScam = preset.category === "Scam";
              return (
                <button
                  key={preset.title}
                  onClick={() => handleSendTurn(preset.text)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all flex items-center gap-2 ${
                    isScam
                      ? "bg-[#FF4D5E]/10 border-[#FF4D5E]/40 text-[#FF4D5E] hover:bg-[#FF4D5E]/20"
                      : "bg-[#3DFF8A]/10 border-[#3DFF8A]/40 text-[#3DFF8A] hover:bg-[#3DFF8A]/20"
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{preset.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Chat & Live Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chat Stream (Left) */}
          <div className="lg:col-span-7 hud p-5 rounded flex flex-col justify-between h-[520px]">
            <div className="flex items-center justify-between border-b border-[#12304A] pb-3 mb-3">
              <span className="text-xs font-bold text-[#D7E6F5] uppercase tracking-wider">
                Conversation Stream (Call: {callId})
              </span>
              <span className="text-[10px] font-mono text-[#6F8AA6]">{history.length} Turns</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {history.map((t, idx) => {
                const isCaller = t.role === "caller";
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded text-xs leading-relaxed ${
                      isCaller
                        ? "bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 text-[#D7E6F5]"
                        : "bg-[#3DFF8A]/10 border border-[#3DFF8A]/30 text-[#D7E6F5]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 font-mono text-[10px]">
                      <span className={isCaller ? "text-[#FF4D5E] font-bold" : "text-[#3DFF8A] font-bold"}>
                        {isCaller ? "YOU (SCAMMER)" : "SAJAG (RAMESH SHARMA / DECOY)"}
                      </span>
                      <span className="text-[#6F8AA6]">Turn #{idx + 1}</span>
                    </div>
                    <p className="font-sans">{t.text}</p>
                  </div>
                );
              })}
              {history.length === 0 && (
                <div className="text-center py-16 text-[#6F8AA6] text-xs italic">
                  Select a preset above or type a scam threat below to begin testing.
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-[#12304A] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendTurn(inputText)}
                placeholder="Type scammer utterance (e.g. 'I am CBI officer, pay fine')..."
                className="flex-1 bg-[#050B14] border border-[#12304A] rounded px-3 py-2 text-xs text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF] font-sans"
              />
              <button
                onClick={() => handleSendTurn(inputText)}
                disabled={loading}
                className="px-4 py-2 rounded bg-[#22E5FF] text-[#050B14] font-bold text-xs hover:bg-[#3DFF8A] transition-all flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Telemetry Panel (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`hud p-5 rounded ${isCritical ? "pulse-critical" : ""}`}>
              <span className="text-[10px] font-mono uppercase text-[#6F8AA6] block mb-2">Live Guardian Evaluation</span>
              <div className="text-center py-4">
                <span className="text-5xl font-black font-mono text-[#D7E6F5]">
                  {(p_scam * 100).toFixed(0)}%
                </span>
                <span className={`block text-xs font-bold mt-1 ${isCritical ? "text-[#FF4D5E]" : "text-[#3DFF8A]"}`}>
                  {latestState?.level || "LOW"} RISK • {latestState?.mode || "MONITOR"} MODE
                </span>
              </div>

              <div className="w-full bg-[#050B14] rounded-full h-2.5 overflow-hidden border border-[#12304A] mb-3">
                <div
                  className={`h-full ${
                    isCritical ? "bg-[#FF4D5E]" : p_scam >= 0.7 ? "bg-[#FFB020]" : "bg-[#3DFF8A]"
                  }`}
                  style={{ width: `${p_scam * 100}%` }}
                />
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-[#12304A]">
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Category:</span>
                  <span className="font-bold text-[#D7E6F5]">{latestState?.category || "BENIGN"}</span>
                </div>
                <div className="flex justify-between text-[#6F8AA6]">
                  <span>Safety Blocks:</span>
                  <span className="font-mono text-[#3DFF8A]">{latestState?.safety_blocks || 0}</span>
                </div>
              </div>
            </div>

            {/* Extracted Leads */}
            <div className="hud p-4 rounded text-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#6F8AA6] block">Captured Identifiers</span>
              {latestState?.identifiers?.map((item: any, i: number) => (
                <div key={i} className="p-2 rounded bg-[#050B14] border border-[#12304A] flex items-center justify-between">
                  <span className="font-mono text-[#22E5FF] uppercase font-bold text-[10px]">{item.type}</span>
                  <code className="text-[#D7E6F5] font-mono text-xs">{item.normalized || item.value}</code>
                </div>
              ))}
              {(!latestState?.identifiers || latestState.identifiers.length === 0) && (
                <p className="text-[11px] text-[#6F8AA6] italic py-1">No suspect handles extracted yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

