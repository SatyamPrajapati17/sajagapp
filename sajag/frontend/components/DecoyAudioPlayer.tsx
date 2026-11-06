"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Shield, Clock, Radio, Activity } from "lucide-react";

interface DecoyAudioPlayerProps {
  audioUrl?: string;
  callId?: string;
}

export default function DecoyAudioPlayer({
  audioUrl = "http://localhost:8000/audio/ramesh_voice.mp3",
  callId = "call-cbi-894"
}: DecoyAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [stallSeconds, setStallSeconds] = useState<number>(764); // 12m 44s baseline
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer counter when playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setStallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Audio play failed:", e);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="hud p-5 rounded space-y-4 border border-[#12304A]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12304A] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30">
            <Radio className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#D7E6F5] uppercase tracking-wider font-mono">
              Live Decoy Audio Stream & Waveform Monitor
            </h3>
            <p className="text-[11px] text-[#6F8AA6] font-mono">
              Retell AI & ElevenLabs Voice Engine: Ramesh Sharma feigning tech confusion & hearing loss
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>DECOY ACTIVE (10+ MINS)</span>
          </span>
        </div>
      </div>

      {/* AUDIO MONITOR HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#050B14] p-4 rounded border border-[#12304A]">
        
        {/* Left: Metadata & Stall Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#6F8AA6]">
            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Scammer Stall Time:</span>
            <span className="text-sm font-bold text-[#00F0FF]">{formatTime(stallSeconds)}</span>
          </div>
          <div className="text-[11px] font-mono text-[#D7E6F5]">
            <span className="text-[#6F8AA6]">Active Target:</span> Inspector Rathore (CBI Impersonator)
          </div>
          <div className="text-[11px] font-mono text-[#D7E6F5]">
            <span className="text-[#6F8AA6]">Decoy Voice:</span> Ramesh Sharma (72-yr elder)
          </div>
          <div className="text-[10px] font-mono text-[#FF3366] bg-[#FF3366]/10 px-2 py-0.5 rounded border border-[#FF3366]/30 inline-block">
            Victim Mic: MUTED FOR ZERO LEAKAGE
          </div>
        </div>

        {/* Center: Live Waveform Visualizer */}
        <div className="flex flex-col justify-center items-center space-y-2">
          <div className="flex items-center gap-1 h-12 w-full justify-center px-4">
            {[40, 75, 20, 90, 60, 30, 85, 100, 45, 70, 95, 35, 80, 50, 65, 85, 30, 95, 60, 40].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.max(15, (h * (0.6 + Math.sin(i + Date.now() / 200) * 0.4)))}%` : "20%",
                  backgroundColor: isPlaying ? (i % 2 === 0 ? "#00F0FF" : "#10B981") : "#12304A"
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-[#6F8AA6] flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#00F0FF]" />
            <span>{isPlaying ? "Live Audio Downlink Streaming" : "Click Play to Monitor Bait Audio"}</span>
          </span>
        </div>

        {/* Right: Audio Controls */}
        <div className="flex flex-col justify-center items-center md:items-end gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold transition-all ${
                isPlaying
                  ? "bg-[#FF3366] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]"
                  : "bg-[#00F0FF] text-[#050B14] hover:bg-[#00F0FF]/80 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause Bait Stream" : "Listen to Decoy"}</span>
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded bg-[#0A1526] border border-[#12304A] text-[#6F8AA6] hover:text-[#00F0FF]"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#FF3366]" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[10px] font-mono text-[#6F8AA6]">
            Incident Ref: <span className="text-[#D7E6F5] font-bold">{callId}</span>
          </span>
        </div>

      </div>

    </div>
  );
}

