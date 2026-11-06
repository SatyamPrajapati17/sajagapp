"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Radio, ArrowUpRight, Search, Filter } from "lucide-react";

export default function CallsListPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/calls")
      .then((res) => res.json())
      .then((data) => setCalls(data.calls || []))
      .catch(() => {
        setCalls([
          {
            id: "call-past-cbi-01",
            state: "ENDED",
            channel: "phone",
            from_number: "+919811223344",
            p_scam: 0.94,
            risk_level: "CRITICAL",
            scam_category: "DIGITAL_ARREST",
            duration_s: 240,
            decoy_seconds: 184,
            started_at: "2026-11-01T00:20:00Z"
          },
          {
            id: "call-past-customs-02",
            state: "ENDED",
            channel: "phone",
            from_number: "+919722334455",
            p_scam: 0.91,
            risk_level: "CRITICAL",
            scam_category: "TRAI_SIM_BLOCK",
            duration_s: 190,
            decoy_seconds: 142,
            started_at: "2026-10-31T23:45:00Z"
          },
          {
            id: "call-past-benign-03",
            state: "ENDED",
            channel: "phone",
            from_number: "+911800112211",
            p_scam: 0.08,
            risk_level: "LOW",
            scam_category: "BENIGN",
            duration_s: 45,
            decoy_seconds: 0,
            started_at: "2026-10-31T23:10:00Z"
          }
        ]);
      });
  }, []);

  const filtered = calls.filter((c) =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.scam_category?.toLowerCase().includes(search.toLowerCase()) ||
    c.from_number?.includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
          <div>
            <span className="text-xs text-[#22E5FF] uppercase font-mono tracking-widest">Call Archives & Audit Records</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
              Protected Line <span className="grad">Call History</span>
            </h1>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#6F8AA6] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, caller, or category..."
              className="bg-[#0A1626] border border-[#12304A] rounded px-3 py-2 pl-9 text-xs text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF] font-mono w-64"
            />
          </div>
        </div>

        <div className="hud rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050B14] text-[#6F8AA6] border-b border-[#12304A] font-mono">
              <tr>
                <th className="px-4 py-3">Incident Reference</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Caller Number</th>
                <th className="px-4 py-3">Scam Category</th>
                <th className="px-4 py-3">Risk Peak</th>
                <th className="px-4 py-3">Decoy Time</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12304A]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#0A1626]/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#D7E6F5]">
                    <Link href={`/calls/${c.id}`} className="hover:text-[#22E5FF]">
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono uppercase text-[#6F8AA6]">{c.channel}</td>
                  <td className="px-4 py-3 font-mono text-[#D7E6F5]">{c.from_number}</td>
                  <td className="px-4 py-3 text-[#3DFF8A] font-semibold">{c.scam_category || "BENIGN"}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className={c.p_scam >= 0.88 ? "text-[#FF4D5E] font-bold" : "text-[#3DFF8A]"}>
                      {((c.p_scam || 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#E4FF3A]">{c.decoy_seconds}s</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/calls/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#12304A] text-[#22E5FF] hover:bg-[#22E5FF] hover:text-[#050B14] font-bold text-[11px]"
                    >
                      <span>Open Console</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

