"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Network, Database, ShieldAlert, ArrowUpRight, Share2, AlertCircle } from "lucide-react";

export default function IntelGraphPage() {
  const [overlaps, setOverlaps] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/overlap")
      .then((res) => res.json())
      .then((data) => setOverlaps(data.overlaps || []))
      .catch(() => {
        // Mock cross-incident overlap
        setOverlaps([
          {
            type: "upi",
            normalized: "mule.account@sbi",
            calls_seen: 2,
            call_ids: ["call-past-cbi-01", "call-past-customs-02"]
          },
          {
            type: "phone",
            normalized: "+919876543210",
            calls_seen: 3,
            call_ids: ["call-past-cbi-01", "call-live-01", "call-past-customs-02"]
          }
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
          <div>
            <span className="text-xs text-[#22E5FF] uppercase font-mono tracking-widest">Syndicate Intelligence Analysis</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
              Cross-Incident <span className="grad">Overlap Graph</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0A1626] border border-[#22E5FF]/30 text-xs text-[#22E5FF]">
            <Share2 className="w-3.5 h-3.5" />
            <span>Investigative Leads Only (Unverified Ownership)</span>
          </div>
        </div>

        {/* Visual Graph Canvas Card */}
        <div className="hud p-6 rounded relative overflow-hidden h-[420px] flex items-center justify-center bg-[#07111F]">
          <div className="absolute inset-0 gridbg opacity-40"></div>
          
          {/* Schematic Network Graph Rendering */}
          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-8">
            <div className="flex items-center justify-around w-full">
              {/* Incident Node 1 */}
              <div className="p-4 rounded hud border-[#FF4D5E]/60 bg-[#0A1626] text-center w-48 shadow-[0_0_20px_rgba(255,77,94,0.2)]">
                <span className="text-[10px] font-mono uppercase text-[#FF4D5E] font-bold block">Incident Alpha</span>
                <span className="text-xs font-bold text-[#D7E6F5] block mt-1">CBI Digital Arrest</span>
                <span className="text-[10px] text-[#6F8AA6] font-mono">call-past-cbi-01</span>
              </div>

              {/* Shared Hub Node */}
              <div className="p-4 rounded-full hud border-[#22E5FF] bg-[#050B14] text-center w-44 h-44 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(34,229,255,0.3)] animate-pulse">
                <Database className="w-6 h-6 text-[#22E5FF] mb-1" />
                <span className="text-[10px] font-mono text-[#3DFF8A] font-bold uppercase">Shared Mule Account</span>
                <code className="text-xs text-[#D7E6F5] font-mono font-bold mt-1">mule.account@sbi</code>
                <span className="text-[9px] text-[#FFB020] mt-1 font-mono">2 Linked Calls</span>
              </div>

              {/* Incident Node 2 */}
              <div className="p-4 rounded hud border-[#FF4D5E]/60 bg-[#0A1626] text-center w-48 shadow-[0_0_20px_rgba(255,77,94,0.2)]">
                <span className="text-[10px] font-mono uppercase text-[#FF4D5E] font-bold block">Incident Beta</span>
                <span className="text-xs font-bold text-[#D7E6F5] block mt-1">Customs Parcel Duty</span>
                <span className="text-[10px] text-[#6F8AA6] font-mono">call-past-customs-02</span>
              </div>
            </div>

            <p className="text-xs text-[#6F8AA6] text-center font-mono">
              Campaign Fingerprint: <span className="text-[#22E5FF]">sha1:cbi-arrest-v1</span> • Syndicate Overlap Detected
            </p>
          </div>
        </div>

        {/* Overlap Summary Table */}
        <div className="hud rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-[#12304A] bg-[#0A1626] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-[#22E5FF]" />
              <span>Multi-Incident Shared Handles</span>
            </h2>
            <span className="text-xs text-[#6F8AA6] font-mono">{overlaps.length} Overlapping Leads</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050B14] text-[#6F8AA6] border-b border-[#12304A] font-mono">
                <tr>
                  <th className="px-4 py-3">Handle Type</th>
                  <th className="px-4 py-3">Normalized Identifier</th>
                  <th className="px-4 py-3">Distinct Incidents Seen</th>
                  <th className="px-4 py-3">Associated Call References</th>
                  <th className="px-4 py-3 text-right">Legal Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12304A]">
                {overlaps.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#0A1626]/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#22E5FF] uppercase font-bold">
                      {item.type}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#D7E6F5] font-bold">
                      {item.normalized}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#E4FF3A]">
                      {item.calls_seen} incidents
                    </td>
                    <td className="px-4 py-3 font-mono text-[#6F8AA6]">
                      {item.call_ids?.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] text-[#FFB020] font-mono">
                      Investigative Lead
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

