"use client";

import React, { useState, useEffect } from "react";
import { Network, ShieldAlert, Smartphone, CreditCard, RefreshCw } from "lucide-react";

interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    data: any;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: any;
  }>;
}

export default function SyndicateGraph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/syndicate-graph");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch syndicate graph:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="hud p-5 rounded space-y-4 border border-[#12304A]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12304A] pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-[#00F0FF] animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
              Cross-Call Scam Syndicate Relational Graph
            </h3>
            <p className="text-[11px] text-[#6F8AA6] font-mono">
              Autonomous correlation of shared suspect UPIs, phone numbers & criminal nodes across victim incidents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40">
            Mule Overlap Detected
          </span>
          <button
            onClick={fetchGraph}
            className="p-1.5 rounded hover:bg-[#12304A] text-[#6F8AA6] hover:text-[#00F0FF] transition-colors"
            title="Refresh Graph"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS & VISUAL MAP */}
      <div className="relative w-full h-[400px] bg-[#050B14] rounded border border-[#12304A] overflow-hidden p-4">
        {/* Ambient Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#12304A 1px, transparent 1px)`,
            backgroundSize: "20px 20px"
          }}
        />

        {/* SVG Connectors / Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="edge-grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3366" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="edge-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Central Syndicate to Incident Links */}
          <line x1="50%" y1="18%" x2="20%" y2="50%" stroke="url(#edge-grad-red)" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
          <line x1="50%" y1="18%" x2="50%" y2="50%" stroke="url(#edge-grad-red)" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
          <line x1="50%" y1="18%" x2="80%" y2="50%" stroke="url(#edge-grad-red)" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />

          {/* Incident to Mule Links */}
          <line x1="20%" y1="58%" x2="32%" y2="84%" stroke="url(#edge-grad-cyan)" strokeWidth="2.5" />
          <line x1="50%" y1="58%" x2="32%" y2="84%" stroke="url(#edge-grad-cyan)" strokeWidth="2.5" />
          <line x1="20%" y1="58%" x2="62%" y2="84%" stroke="#10B981" strokeWidth="1.5" />
          <line x1="80%" y1="58%" x2="88%" y2="84%" stroke="#10B981" strokeWidth="1.5" />
        </svg>

        {/* NODES LAYER */}
        <div className="relative w-full h-full flex flex-col justify-between py-2">
          
          {/* LEVEL 1: Central Syndicate Node */}
          <div className="flex justify-center">
            <div 
              onClick={() => setSelectedNode({
                type: "SYNDICATE_ORGANIZATION",
                name: "CBI / Digital Arrest Crime Cluster #409",
                status: "ACTIVE SYNDICATE",
                detail: "Operating across Delhi-NCR and Mumbai. Coordinated impersonation with fake arrest summons and mule UPI gateways."
              })}
              className="cursor-pointer px-4 py-2 rounded bg-[#0A1526] border-2 border-[#FF3366] text-center shadow-[0_0_20px_rgba(255,51,102,0.3)] hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-1.5 justify-center text-[10px] uppercase font-mono font-bold text-[#FF3366]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Suspected Crime Syndicate</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D7E6F5] block mt-0.5">
                CBI / Digital Arrest Syndicate #409
              </span>
              <span className="text-[9px] font-mono text-[#6F8AA6] block">
                NCRP Central Grid Linkage: 3 Active Mules
              </span>
            </div>
          </div>

          {/* LEVEL 2: Victim Call Incidents */}
          <div className="flex justify-around px-2">
            
            {/* Call 1 */}
            <div 
              onClick={() => setSelectedNode({
                type: "VICTIM_INCIDENT",
                name: "Incident call-cbi-894",
                victim: "+919922996010",
                caller: "+919876543210",
                threat: "96% (CRITICAL)",
                status: "DECOY INTERCEPTED",
                quote: "I am Inspector Rathore from CBI Cyber Crime. Transfer Rs 25000 to police.verify@sbi."
              })}
              className="cursor-pointer p-2.5 rounded bg-[#0A1526] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:scale-105 transition-transform max-w-[200px]"
            >
              <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#00F0FF] uppercase mb-1">
                <span>Incident #1</span>
                <span className="text-[#FF3366] font-bold">96% Threat</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D7E6F5] block truncate">call-cbi-894</span>
              <span className="text-[10px] text-[#6F8AA6] font-mono block">Victim: +919922996010</span>
              <span className="text-[9px] text-[#3DFF8A] font-mono block mt-1">● Decoy Active (12m)</span>
            </div>

            {/* Call 2 (Shared Mule Link) */}
            <div 
              onClick={() => setSelectedNode({
                type: "VICTIM_INCIDENT",
                name: "Incident call-fedex-312",
                victim: "+919822334455",
                caller: "+919811223344",
                threat: "92% (CRITICAL)",
                status: "CROSS-INCIDENT CORRELATED",
                quote: "Customs clearance penalty of Rs 25000 to police.verify@sbi."
              })}
              className="cursor-pointer p-2.5 rounded bg-[#0A1526] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:scale-105 transition-transform max-w-[200px]"
            >
              <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#00F0FF] uppercase mb-1">
                <span>Incident #2</span>
                <span className="text-[#FF3366] font-bold">92% Threat</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D7E6F5] block truncate">call-fedex-312</span>
              <span className="text-[10px] text-[#6F8AA6] font-mono block">Victim: +919822334455</span>
              <span className="text-[9px] text-[#FFB020] font-mono block mt-1">● Cross-Linked Mule</span>
            </div>

            {/* Call 3 */}
            <div 
              onClick={() => setSelectedNode({
                type: "VICTIM_INCIDENT",
                name: "Incident call-eb-701",
                victim: "+919922996010",
                caller: "+919733445566",
                threat: "89% (HIGH)",
                status: "INTERCEPTED",
                quote: "Electricity power will be cut tonight. Refer FIR case CBI-DEL-2026-904."
              })}
              className="cursor-pointer p-2.5 rounded bg-[#0A1526] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:scale-105 transition-transform max-w-[200px]"
            >
              <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#00F0FF] uppercase mb-1">
                <span>Incident #3</span>
                <span className="text-[#FFB020] font-bold">89% Threat</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D7E6F5] block truncate">call-eb-701</span>
              <span className="text-[10px] text-[#6F8AA6] font-mono block">Victim: +919922996010</span>
              <span className="text-[9px] text-[#3DFF8A] font-mono block mt-1">● Extracted Case #</span>
            </div>

          </div>

          {/* LEVEL 3: Extracted Suspect Mule Identifiers */}
          <div className="flex justify-around px-4">
            
            {/* Mule UPI (Shared by Call 1 & 2) */}
            <div 
              onClick={() => setSelectedNode({
                type: "SUSPECT_MULE_UPI",
                name: "police.verify@sbi",
                detail: "High-priority beneficiary handle. Observed across 2 distinct victim calls (call-cbi-894 & call-fedex-312).",
                status: "FLAGGED FOR NPCI FREEZE",
                source: "State Bank of India VPA"
              })}
              className="cursor-pointer p-2.5 rounded bg-[#08192E] border-2 border-[#FF3366] shadow-[0_0_15px_rgba(255,51,102,0.4)] hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#FF3366] uppercase mb-0.5">
                <CreditCard className="w-3 h-3" />
                <span>Shared Mule UPI</span>
              </div>
              <code className="text-xs font-mono font-bold text-[#00F0FF] block">
                police.verify@sbi
              </code>
              <span className="text-[9px] text-[#10B981] font-mono block">
                ✓ Cross-Correlated in 2 Calls
              </span>
            </div>

            {/* Suspect Phone */}
            <div 
              onClick={() => setSelectedNode({
                type: "SUSPECT_PHONE",
                name: "+919876543210",
                detail: "Suspect caller line reported from Pune/MH telecom circle. Impersonating Inspector Rathore.",
                status: "TRACKED",
                source: "Carrier: Vi India"
              })}
              className="cursor-pointer p-2.5 rounded bg-[#08192E] border border-[#10B981] hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#10B981] uppercase mb-0.5">
                <Smartphone className="w-3 h-3" />
                <span>Caller Line</span>
              </div>
              <code className="text-xs font-mono text-[#D7E6F5] block">
                +919876543210
              </code>
              <span className="text-[9px] text-[#6F8AA6] font-mono block">
                Caller Line Identified
              </span>
            </div>

            {/* Suspect Case # */}
            <div 
              onClick={() => setSelectedNode({
                type: "SUSPECT_CASE_ID",
                name: "CBI-DEL-2026-904",
                detail: "Fabricated official FIR reference used to intimidate elderly citizens into compliance.",
                status: "VERIFIED FICTITIOUS",
                source: "Claimed: CBI Directorate"
              })}
              className="cursor-pointer p-2.5 rounded bg-[#08192E] border border-[#12304A] hover:scale-105 transition-transform"
            >
              <div className="text-[9px] font-mono text-[#6F8AA6] uppercase mb-0.5">
                Fabricated Case #
              </div>
              <code className="text-xs font-mono text-[#D7E6F5] block">
                CBI-DEL-2026-904
              </code>
              <span className="text-[9px] text-[#FFB020] font-mono block">
                Phishing Pretext
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* NODE INSPECTOR DRAWER */}
      {selectedNode && (
        <div className="p-3 bg-[#0A1526] rounded border border-[#00F0FF]/40 text-xs font-mono space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">
              {selectedNode.type} Details
            </span>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="text-[#6F8AA6] hover:text-[#D7E6F5] text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="text-sm font-bold text-[#D7E6F5]">{selectedNode.name}</div>
          <div className="text-[#6F8AA6] text-[11px]">{selectedNode.detail || selectedNode.quote}</div>
          {selectedNode.status && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
              {selectedNode.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

