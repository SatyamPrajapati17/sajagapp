"use client";

import Link from "next/link";
import { Shield, PhoneCall, Volume2, Activity } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-[#12304A] bg-[#0A1626]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <Shield className="w-7 h-7 text-[#22E5FF] group-hover:text-[#3DFF8A] transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DFF8A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3DFF8A]"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="grad text-xl tracking-wider font-extrabold font-mono">SAJAG AI</span>
          <span className="text-[10px] text-[#6F8AA6] tracking-widest uppercase">Autonomous Scam-Baiting Defence</span>
        </div>
      </Link>

      {/* Live System Telemetry Badges */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Twilio Telephony Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#050B14] border border-[#12304A] text-xs">
          <PhoneCall className="w-3.5 h-3.5 text-[#22E5FF]" />
          <span className="text-[#6F8AA6]">Twilio:</span>
          <span className="font-mono text-[#D7E6F5] font-bold">+1 (737) 250-8034</span>
        </div>

        {/* ElevenLabs Persona */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#050B14] border border-[#12304A] text-xs">
          <Volume2 className="w-3.5 h-3.5 text-[#E4FF3A]" />
          <span className="text-[#6F8AA6]">Voice:</span>
          <span className="font-mono text-[#D7E6F5] font-bold">Ramesh Sharma (72y)</span>
        </div>

        {/* Guardian Detection Engine */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#050B14] border border-[#12304A] text-xs text-[#3DFF8A]">
          <Activity className="w-3.5 h-3.5 text-[#3DFF8A] animate-pulse" />
          <span className="font-mono font-bold">GUARDIAN ACTIVE (p &ge; 0.88)</span>
        </div>
      </div>

      {/* Live Operations Indicator */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-[#3DFF8A]/10 border border-[#3DFF8A]/40 text-[#3DFF8A] text-xs font-mono font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3DFF8A] animate-pulse"></span>
          <span>ONLINE • NO AUTH REQUIRED</span>
        </span>
      </div>
    </nav>
  );
}
