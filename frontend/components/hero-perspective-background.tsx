'use client';

import React from 'react';

export function HeroPerspectiveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(23,105,255,0.10),transparent_34%),radial-gradient(circle_at_18%_58%,rgba(24,135,91,0.045),transparent_24%),linear-gradient(180deg,#F7FAFD_0%,#F5F8FC_62%,#EDF4FB_100%)]" />

      {/* Fine engineering reference grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0B1220 1px, transparent 1px), linear-gradient(to bottom, #0B1220 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%)',
        }}
      />

      {/* Horizon / digital-twin atmosphere */}
      <div className="absolute left-1/2 top-[48%] h-px w-[72vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#1769FF]/20 to-transparent" />
      <div className="absolute left-1/2 top-[48%] h-20 w-[72vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(23,105,255,0.055),transparent_68%)] blur-xl" />

      {/* Perspective engineering floor */}
      <div className="absolute inset-x-0 bottom-0 h-[46%] overflow-hidden [perspective:900px]">
        <div
          className="absolute -bottom-[30%] left-1/2 h-[115%] w-[150%] -translate-x-1/2 [transform:rotateX(62deg)]"
          style={{
            transformOrigin: '50% 100%',
            backgroundImage:
              'linear-gradient(to right, rgba(23,105,255,.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,105,255,.13) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.18) 18%, rgba(0,0,0,.7) 72%, rgba(0,0,0,.92) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.18) 18%, rgba(0,0,0,.7) 72%, rgba(0,0,0,.92) 100%)',
          }}
        />
      </div>

      {/* Deterministic cyber-physical signal routes */}
      <svg className="absolute inset-x-0 bottom-[8%] h-[44%] w-full opacity-45" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroSignalBlue" x1="0" x2="1">
            <stop offset="0" stopColor="#1769FF" stopOpacity="0" />
            <stop offset=".45" stopColor="#1769FF" stopOpacity=".75" />
            <stop offset="1" stopColor="#1769FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 315 C250 285 320 250 520 270 S900 310 1120 220 S1320 145 1440 155" fill="none" stroke="url(#heroSignalBlue)" strokeWidth="1.5" />
        <path d="M0 350 C270 325 420 335 650 300 S1010 210 1440 250" fill="none" stroke="#18875B" strokeOpacity=".18" strokeWidth="1" />
        <path d="M190 420 L390 235 L720 210 L1035 275 L1270 150" fill="none" stroke="#1769FF" strokeOpacity=".10" strokeWidth="1" strokeDasharray="5 8" />
        {[{x:390,y:235},{x:720,y:210},{x:1035,y:275},{x:1270,y:150}].map((p) => (
          <circle key={p.x} cx={p.x} cy={p.y} r="3" fill="#1769FF" fillOpacity=".55" />
        ))}
      </svg>

      {/* Soft lower fade so content remains dominant */}
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#F5F8FC] via-[#F5F8FC]/65 to-transparent" />
    </div>
  );
}
