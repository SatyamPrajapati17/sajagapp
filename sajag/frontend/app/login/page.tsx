"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Shield, Lock, User, Users, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"family" | "analyst" | "admin">("analyst");
  const [email, setEmail] = useState("analyst@sajag.gov.in");
  const [password, setPassword] = useState("sajag-demo-2026");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "analyst" as const,
      label: "Police / Analyst",
      email: "analyst@sajag.gov.in",
      desc: "Full incident review, intelligence graph, 1930 report approval",
      icon: ShieldAlert,
    },
    {
      id: "family" as const,
      label: "Family Guardian",
      email: "family@demo.in",
      desc: "Monitor elder's phone line, receive alerts, 3s cancel takeover",
      icon: Users,
    },
    {
      id: "admin" as const,
      label: "System Admin",
      email: "admin@sajag.gov.in",
      desc: "Audit logs, policy gates, threshold overrides",
      icon: Shield,
    },
  ];

  const handleSelectRole = (r: "family" | "analyst" | "admin") => {
    setRole(r);
    const selected = roles.find((item) => item.id === r);
    if (selected) {
      setEmail(selected.email);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // In demo mode, redirect to console
      router.push("/console");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14]">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* ALM-Guard Centered HUD Card */}
          <div className="hud p-8 rounded border-[#22E5FF]/40 shadow-[0_0_40px_rgba(34,229,255,0.15)]">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-full bg-[#050B14] border border-[#22E5FF]/40 mb-3">
                <Shield className="w-8 h-8 text-[#22E5FF]" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-wider text-[#D7E6F5] uppercase">
                Secure Access HUD
              </h2>
              <p className="text-xs text-[#6F8AA6] mt-1 tracking-widest uppercase">
                Authenticated Operator Terminal
              </p>
            </div>

            {/* Role Selection Tiles */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#6F8AA6] uppercase tracking-wider mb-2">
                Select Identity Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRole(item.id)}
                      className={`p-2.5 rounded border text-left flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#12304A] border-[#22E5FF] text-[#22E5FF] shadow-[0_0_12px_rgba(34,229,255,0.2)]"
                          : "bg-[#050B14] border-[#12304A] text-[#6F8AA6] hover:border-[#22E5FF]/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6F8AA6] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6F8AA6] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#050B14] border border-[#12304A] rounded px-3 py-2.5 pl-9 text-xs text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F8AA6] uppercase tracking-wider mb-1">
                  Access Key / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6F8AA6] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#050B14] border border-[#12304A] rounded px-3 py-2.5 pl-9 text-xs text-[#D7E6F5] focus:outline-none focus:border-[#22E5FF] font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#050B14] rounded border border-[#12304A] flex items-center justify-between text-[11px] text-[#3DFF8A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3DFF8A]" />
                  <span>Demo Mode: Credentials Pre-filled</span>
                </div>
                <span className="font-mono text-[#6F8AA6]">Ready</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded bg-[#22E5FF] text-[#050B14] font-bold text-xs uppercase tracking-wider hover:bg-[#3DFF8A] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,229,255,0.3)]"
              >
                {loading ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Enter Command Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

