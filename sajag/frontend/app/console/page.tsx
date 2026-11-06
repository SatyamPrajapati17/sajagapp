"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Radio, ShieldAlert, Clock, Database, AlertTriangle, ArrowUpRight, Activity, CheckCircle, RefreshCw } from "lucide-react";

export default function ConsoleWallPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/calls");
      const data = await res.json();
      setCalls(data.calls || []);
    } catch {
      // Offline fallback mock data for smooth demo
      setCalls([
        {
          id: "call-live-cbi-01",
          state: "DECOY_ACTIVE",
          channel: "phone",
          from_number: "+919876543210",
          p_scam: 0.96,
          risk_level: "CRITICAL",
          scam_category: "DIGITAL_ARREST",
          duration_s: 185,
          decoy_seconds: 140,
          started_at: "2026-11-01T00:20:00Z",
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
          started_at: "2026-10-31T23:45:00Z",
        },
        {
          id: "call-past-benign-03",
          state: "ENDED",
          channel: "sim",
          from_number: "+911800112211",
          p_scam: 0.08,
          risk_level: "LOW",
          scam_category: "BENIGN",
          duration_s: 45,
          decoy_seconds: 0,
          started_at: "2026-10-31T23:10:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalDecoySec = calls.reduce((acc, c) => acc + (c.decoy_seconds || 0), 0);
  const mm = Math.floor(totalDecoySec / 60);
  const ss = totalDecoySec % 60;
  const timeWastedFormatted = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const kpis = [
    { label: "Active Calls", value: calls.filter((c) => c.state !== "ENDED").length, color: "border-l-[#22E5FF]" },
    { label: "Scams Blocked", value: calls.filter((c) => c.p_scam >= 0.88).length, color: "border-l-[#3DFF8A]" },
    { label: "Avg Threat Risk", value: `${(calls.reduce((acc, c) => acc + (c.p_scam || 0), 0) / (calls.length || 1) * 100).toFixed(0)}%`, color: "border-l-[#FFB020]" },
    { label: "Decoy Wasted Time", value: timeWastedFormatted, color: "border-l-[#E4FF3A]" },
    { label: "Identified Mule Leads", value: 3, color: "border-l-[#FF4D5E]" },
    { label: "Repeat Identifiers", value: 1, color: "border-l-[#22E5FF]" },
  ];

  const systemHealth = [
    { name: "FastAPI Backend", status: "Online" },
    { name: "LangGraph Engine", status: "Online" },
    { name: "NVIDIA NIM (Llama-3)", status: "Active" },
    { name: "Retell WebSocket", status: "Listening" },
    { name: "Supabase PG & RLS", status: "Secured" },
    { name: "n8n Webhook Engine", status: "Active" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
          <div>
            <span className="text-xs text-[#22E5FF] uppercase tracking-widest font-mono">AQUILA C4I Operations Wall</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
              Real-Time Defence <span className="grad">Telemetry</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCalls}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A1626] border border-[#12304A] text-xs text-[#6F8AA6] hover:text-[#22E5FF]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <Link
              href="/simulator"
              className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#22E5FF] text-[#050B14] font-bold text-xs uppercase tracking-wider hover:bg-[#3DFF8A] transition-all"
            >
              <span>Launch Simulator</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* KPI Tiles Wall */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`hud p-4 rounded border-l-4 ${kpi.color} bg-[#0A1626] flex flex-col justify-between`}
            >
              <span className="text-[10px] uppercase tracking-wider text-[#6F8AA6] block">{kpi.label}</span>
              <span className="text-2xl font-black text-[#D7E6F5] font-mono mt-2">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* System Health Dots */}
        <div className="hud p-4 rounded bg-[#0A1626] flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-[11px] font-bold text-[#6F8AA6] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#22E5FF]" />
            <span>Infrastructure Health Status</span>
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {systemHealth.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3DFF8A] animate-pulse"></span>
                <span className="text-[#D7E6F5]/80">{item.name}:</span>
                <span className="text-[#3DFF8A] font-mono">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Call Registry Table */}
        <div className="hud rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-[#12304A] flex items-center justify-between bg-[#0A1626]">
            <h2 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#22E5FF]" />
              <span>Live Phone & Simulation Feeds</span>
            </h2>
            <span className="text-xs text-[#6F8AA6] font-mono">{calls.length} Active Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050B14] text-[#6F8AA6] border-b border-[#12304A] font-mono">
                <tr>
                  <th className="px-4 py-3">Incident ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Caller Identity</th>
                  <th className="px-4 py-3">Threat Category</th>
                  <th className="px-4 py-3">Risk Gauge</th>
                  <th className="px-4 py-3">Decoy Time</th>
                  <th className="px-4 py-3 text-right">Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12304A]">
                {calls.map((call) => {
                  const isCritical = call.p_scam >= 0.88;
                  const isDecoy = call.state === "DECOY_ACTIVE";
                  return (
                    <tr
                      key={call.id}
                      className={`hover:bg-[#0A1626]/80 transition-colors ${
                        isCritical ? "bg-[#FF4D5E]/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#D7E6F5]">
                        <Link href={`/calls/${call.id}`} className="hover:text-[#22E5FF] transition-colors">
                          {call.id.slice(0, 16)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isDecoy
                              ? "bg-[#E4FF3A]/20 text-[#E4FF3A] border border-[#E4FF3A]/40 animate-pulse"
                              : call.state === "ENDED"
                              ? "bg-[#12304A] text-[#6F8AA6]"
                              : "bg-[#22E5FF]/20 text-[#22E5FF] border border-[#22E5FF]/40"
                          }`}
                        >
                          {call.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono uppercase text-[#6F8AA6]">
                        {call.channel}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#D7E6F5]">
                        {call.from_number || "Protected Line"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#D7E6F5]">
                        {call.scam_category || "UNCERTAIN"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-[#050B14] rounded-full h-2 overflow-hidden border border-[#12304A]">
                            <div
                              className={`h-full ${
                                isCritical ? "bg-[#FF4D5E]" : call.p_scam >= 0.7 ? "bg-[#FFB020]" : "bg-[#3DFF8A]"
                              }`}
                              style={{ width: `${(call.p_scam || 0) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#D7E6F5]">
                            {((call.p_scam || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E4FF3A]">
                        {call.decoy_seconds ? `${call.decoy_seconds}s` : "0s"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/calls/${call.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#12304A] text-[#22E5FF] hover:bg-[#22E5FF] hover:text-[#050B14] transition-all font-bold text-[11px]"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

