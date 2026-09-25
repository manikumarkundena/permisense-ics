'use client';

import React from 'react';
import { Activity, Cpu, Disc, Server, Zap } from 'lucide-react';

const nodes = [
  { label: 'ENGINEERING WORKSTATION', sub: 'CONTROL SURFACE', icon: Server },
  { label: 'PLC-01', sub: 'INDUSTRIAL CONTROL', icon: Cpu },
  { label: 'MODBUS / TCP', sub: 'PROTOCOL PATH', icon: Activity },
  { label: 'MOTOR / DRIVE', sub: 'ACTUATION', icon: Zap },
  { label: 'CONVEYOR', sub: 'PROCESS', icon: Disc },
  { label: 'PROCESS TELEMETRY', sub: 'OBSERVATION', icon: Activity },
];

export function HeroSignalPath() {
  return (
    <div className="w-full max-w-5xl mx-auto pt-7 pb-2">
      <div className="relative">
        <div className="hidden lg:block absolute left-[5%] right-[5%] top-4 h-px bg-gradient-to-r from-transparent via-[#1769FF]/25 to-transparent" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {nodes.map(({ label, sub, icon: Icon }) => (
            <div key={label} className="group flex flex-col items-center text-center">
              <div className="relative mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200/80 bg-white/75 text-[#1769FF] shadow-[0_5px_20px_rgba(23,105,255,.08)] backdrop-blur-sm">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-[9px] font-mono font-bold tracking-[0.08em] text-slate-700">{label}</div>
              <div className="mt-1 text-[8px] font-mono tracking-[0.08em] text-slate-400">{sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-[9px] font-mono font-semibold tracking-[0.16em] text-slate-400">
          PROTOCOL-REAL · HARDWARE-INDEPENDENT · HUMAN-CONTROLLED
        </div>
      </div>
    </div>
  );
}
