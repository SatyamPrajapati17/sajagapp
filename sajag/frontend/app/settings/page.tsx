"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Sliders, Shield, Bell, Phone, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [familyPhone, setFamilyPhone] = useState("+919876543210");
  const [consentMonitoring, setConsentMonitoring] = useState(true);
  const [consentTranscripts, setConsentTranscripts] = useState(true);
  const [consentAlerts, setConsentAlerts] = useState(true);
  const [whitelist, setWhitelist] = useState("+911800112211, +919988776655");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="border-b border-[#12304A] pb-4">
          <span className="text-xs text-[#22E5FF] uppercase font-mono tracking-widest">Citizen Privacy & Safety Controls</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
            Protection <span className="grad">Settings & Whitelist</span>
          </h1>
        </div>

        <form onSubmit={handleSave} className="hud p-6 rounded space-y-6">
          {/* Privacy & DPDP Consent Gates */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#22E5FF]" />
              <span>DPDP Compliance & Informed Consent</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded bg-[#050B14] border border-[#12304A] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#D7E6F5] block">Real-Time Threat Detection</span>
                  <span className="text-[11px] text-[#6F8AA6]">Allow Sajag Guardian to inspect live caller utterances during incoming calls.</span>
                </div>
                <input
                  type="checkbox"
                  checked={consentMonitoring}
                  onChange={(e) => setConsentMonitoring(e.target.checked)}
                  className="w-4 h-4 accent-[#22E5FF]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded bg-[#050B14] border border-[#12304A] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#D7E6F5] block">Tamper-Proof Evidence Retention</span>
                  <span className="text-[11px] text-[#6F8AA6]">Cryptographically chain and store transcripts of confirmed scam attempts (benign calls are purged immediately).</span>
                </div>
                <input
                  type="checkbox"
                  checked={consentTranscripts}
                  onChange={(e) => setConsentTranscripts(e.target.checked)}
                  className="w-4 h-4 accent-[#22E5FF]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded bg-[#050B14] border border-[#12304A] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#D7E6F5] block">Instant SMS Alerts to Family</span>
                  <span className="text-[11px] text-[#6F8AA6]">Send automated warning SMS to guardian phone when takeover countdown initiates.</span>
                </div>
                <input
                  type="checkbox"
                  checked={consentAlerts}
                  onChange={(e) => setConsentAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#22E5FF]"
                />
              </label>
            </div>
          </div>

          {/* Family Contact & Whitelist */}
          <div className="space-y-4 pt-4 border-t border-[#12304A]">
            <h2 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#3DFF8A]" />
              <span>Family Alert Phone & Number Whitelist</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6F8AA6] uppercase font-mono mb-1">
                  Family Guardian Mobile (SMS Recipient)
                </label>
                <input
                  type="text"
                  value={familyPhone}
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  className="w-full bg-[#050B14] border border-[#12304A] rounded px-3 py-2 text-xs font-mono text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F8AA6] uppercase font-mono mb-1">
                  Trusted Whitelist Numbers (Comma Separated)
                </label>
                <input
                  type="text"
                  value={whitelist}
                  onChange={(e) => setWhitelist(e.target.value)}
                  className="w-full bg-[#050B14] border border-[#12304A] rounded px-3 py-2 text-xs font-mono text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF]"
                />
                <span className="text-[10px] text-[#6F8AA6] mt-1 block">Calls from these numbers will never trigger decoy takeover.</span>
              </div>
            </div>
          </div>

          {/* Read-Only Takeover Threshold */}
          <div className="space-y-2 pt-4 border-t border-[#12304A]">
            <label className="block text-xs font-semibold text-[#6F8AA6] uppercase font-mono">
              Intervention Threshold (Fixed in Demo)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value="0.88"
                disabled
                className="flex-1 accent-[#FF4D5E] opacity-75"
              />
              <span className="font-mono text-sm font-bold text-[#FF4D5E] px-2 py-1 rounded bg-[#050B14] border border-[#12304A]">
                0.88 P(Scam)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#12304A]">
            {saved ? (
              <span className="text-xs text-[#3DFF8A] flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved Successfully</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded bg-[#22E5FF] text-[#050B14] font-bold text-xs uppercase hover:bg-[#3DFF8A] transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

