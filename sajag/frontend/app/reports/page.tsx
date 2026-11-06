"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { FileText, Download, CheckCircle2, ShieldCheck, Copy, ExternalLink } from "lucide-react";

export default function ReportsPage() {
  const [selectedCallId, setSelectedCallId] = useState("call-past-cbi-01");
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);

  const reports = [
    {
      id: "SAJAG-CBI-01",
      callId: "call-past-cbi-01",
      date: "2026-11-01 00:20:00",
      category: "DIGITAL_ARREST",
      score: 0.94,
      mule: "mule.account@sbi",
      headHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    },
    {
      id: "SAJAG-CUSTOMS-02",
      callId: "call-past-customs-02",
      date: "2026-10-31 23:45:00",
      category: "TRAI_SIM_BLOCK",
      score: 0.91,
      mule: "mule.account@sbi",
      headHash: "sha256:9a4f3b21657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126abc"
    }
  ];

  const handleApprove = async () => {
    try {
      await fetch(`http://localhost:8000/reports/${selectedCallId}/approve`, { method: "POST" });
    } catch {
      // offline resilience
    }
    setApproved(true);
  };

  const handleDownloadPDF = () => {
    window.open(`http://localhost:8000/reports/${selectedCallId}/pdf`, "_blank");
  };

  const activeReport = reports.find((r) => r.callId === selectedCallId) || reports[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12304A] pb-4">
          <div>
            <span className="text-xs text-[#22E5FF] uppercase font-mono tracking-widest">Official Cybercrime Dossiers</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#D7E6F5]">
              Incident Reports & <span className="grad">1930 Portal Guide</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={approved}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase transition-all ${
                approved
                  ? "bg-[#3DFF8A]/20 border border-[#3DFF8A] text-[#3DFF8A]"
                  : "bg-[#22E5FF] text-[#050B14] hover:bg-[#3DFF8A]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{approved ? "Report Approved" : "Approve Report"}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#0A1626] border border-[#22E5FF]/40 text-[#22E5FF] hover:bg-[#22E5FF]/10 text-xs font-bold uppercase"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* 2-Column: Report List & Detail Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of Reports */}
          <div className="lg:col-span-4 hud p-4 rounded space-y-3">
            <span className="text-xs font-bold text-[#6F8AA6] uppercase font-mono block">Incident Dossiers</span>
            {reports.map((rep) => {
              const isSelected = rep.callId === selectedCallId;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedCallId(rep.callId)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#12304A] border-[#22E5FF] shadow-[0_0_12px_rgba(34,229,255,0.2)]"
                      : "bg-[#050B14] border-[#12304A] hover:border-[#22E5FF]/40"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold font-mono text-[#D7E6F5]">{rep.id}</span>
                    <span className="text-[10px] font-mono text-[#FF4D5E] font-bold">{(rep.score * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-[11px] text-[#3DFF8A] block font-semibold">{rep.category}</span>
                  <span className="text-[10px] text-[#6F8AA6] font-mono mt-1 block">{rep.date}</span>
                </div>
              );
            })}
          </div>

          {/* Dossier Preview */}
          <div className="lg:col-span-8 hud p-6 rounded space-y-6">
            <div className="border-b border-[#12304A] pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-[#FF4D5E] bg-[#FF4D5E]/10 px-2 py-0.5 rounded uppercase font-bold">
                  AI-Generated • Pending Human Review
                </span>
                <h2 className="text-xl font-bold text-[#D7E6F5] mt-2 font-mono">{activeReport.id}</h2>
                <p className="text-xs text-[#6F8AA6]">Incident Reference: {activeReport.callId}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#3DFF8A]">Status: {approved ? "APPROVED" : "DRAFT"}</span>
              </div>
            </div>

            {/* Evidence summary */}
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-[#D7E6F5] uppercase tracking-wide mb-1">1. Executive Summary</h3>
                <p className="text-[#6F8AA6] leading-relaxed bg-[#050B14] p-3 rounded border border-[#12304A]">
                  Victim received high-pressure call claiming to be Inspector Rathore from CBI Cyber Cell Delhi. 
                  The scammer demanded immediate payment of Rs 10,000 for clearing a fabricated money laundering warrant. 
                  Sajag Decoy successfully stalled the fraudster for 3m 4s and captured destination payment credentials.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#D7E6F5] uppercase tracking-wide mb-1">2. Suspect Identifiers Captured</h3>
                <div className="p-3 bg-[#050B14] rounded border border-[#12304A] space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#6F8AA6]">Destination UPI:</span>
                    <span className="text-[#22E5FF] font-bold">{activeReport.mule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6F8AA6]">Verification Status:</span>
                    <span className="text-[#3DFF8A]">Syntax Valid (Lead)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#D7E6F5] uppercase tracking-wide mb-1">3. Guided 1930 / Cybercrime.gov.in Steps</h3>
                <div className="p-4 bg-[#050B14] rounded border border-[#12304A] space-y-2">
                  <p className="text-[#D7E6F5]">
                    Copy the details below and paste into the <b>National Cyber Crime Reporting Portal</b>:
                  </p>
                  <div className="flex items-center justify-between p-2 rounded bg-[#0A1626] font-mono text-[11px] text-[#22E5FF]">
                    <span>Category: Financial Fraud & Impersonation • Suspect: {activeReport.mule}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Category: Financial Fraud\nSuspect: ${activeReport.mule}\nIncident: ${activeReport.callId}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[10px] text-[#3DFF8A] hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#D7E6F5] uppercase tracking-wide mb-1">4. Cryptographic Proof of Custody</h3>
                <code className="block p-2.5 bg-[#050B14] rounded border border-[#12304A] font-mono text-[10px] text-[#6F8AA6] break-all">
                  Head Hash: {activeReport.headHash}
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

