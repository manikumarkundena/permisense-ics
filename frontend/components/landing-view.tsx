'use client';

import React from 'react';
import { HeroPerspectiveBackground } from './hero-perspective-background';
import { HeroSignalPath } from './hero-signal-path';
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  Layers,
  Terminal,
  Lock,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface LandingViewProps {
  onNavigateToConsole: () => void;
  onNavigateToDemo: () => void;
  actualSpeed?: number;
  isAlert?: boolean;
}

export function LandingView({
  onNavigateToConsole,
  onNavigateToDemo,
}: LandingViewProps) {
  return (
    <div className="space-y-0 text-[#0B1220]">
      {/* SECTION 1: CENTERED HERO with Full-Width Perspective & Architectural Background */}
      <section className="relative min-h-[85vh] lg:min-h-[88vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#F5F8FC]">
        {/* Full-width Perspective & Atmospheric Background */}
        <HeroPerspectiveBackground />

        {/* Centered Hero Content Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center py-16 sm:py-20 flex flex-col items-center justify-center space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-xs font-mono font-medium text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1769FF] animate-pulse" />
            <span className="tracking-wide">CYBER-PHYSICAL INCIDENT INTELLIGENCE FOR INDUSTRIAL ENVIRONMENTS</span>
          </div>

          {/* Centered 3-Line Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12] text-center max-w-4xl mx-auto">
            <span className="block text-[#0B1220]">Detect the threat.</span>
            <span className="block text-[#1769FF]">Trace the impact.</span>
            <span className="block text-[#0B1220]">Decide the response.</span>
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto text-center text-balance">
            PermiSense bridges industrial cybersecurity and physical process engineering. 
            It connects unauthorized industrial communication to affected control assets, 
            measures process deviation, explains the evidence, and enables controlled human-approved remediation.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onNavigateToConsole}
              className="px-6 py-3.5 rounded-xl bg-[#1769FF] hover:bg-[#1359dc] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              Launch Operator Console
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToDemo}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-mono font-medium border border-slate-300 flex items-center gap-2 transition-all shadow-xs active:scale-[0.99]"
            >
              <Terminal className="w-4 h-4 text-[#1769FF]" />
              Open Protocol-Real Demo Lab
            </button>
          </div>

          {/* Product Proof Line */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-500 pt-2">
            <span className="font-semibold text-slate-700">REAL INDUSTRIAL SIGNAL</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-slate-700">PROCESS CONTEXT</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-slate-700">EXPLAINABLE IMPACT</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-slate-700">HUMAN RESPONSE</span>
          </div>

          {/* Cyber-Physical Architectural Signal Chain (Light Architectural Schematic) */}
          <HeroSignalPath />

          {/* Industry 5.0 Subtle Integration */}
          <div className="pt-4 border-t border-slate-200/70 w-full max-w-md mx-auto flex items-center justify-center gap-2.5 text-[11px] font-mono text-slate-500">
            <span className="font-bold text-slate-700 tracking-wider">INDUSTRY 5.0</span>
            <span>·</span>
            <span>HUMAN-CENTRIC · RESILIENT · SUSTAINABLE</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHITE - "An alert is not an incident. Context makes it one." */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="text-xs font-mono font-bold tracking-widest text-[#1769FF] uppercase">
            OPERATIONAL CONTEXTUALIZATION
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B1220] leading-tight text-balance">
            &ldquo;An alert is not an incident. Context makes it one.&rdquo;
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-sans">
            In industrial networks, thousands of network anomalies and benign configuration changes occur daily. 
            Isolated packet alerts lack consequence. PermiSense correlates control-layer anomalies directly with physical sensor readouts, 
            verifying whether a physical deviation occurred before escalating to operational incident status.
          </p>

          {/* Context Progression */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 pt-8 text-xs font-mono">
            {[
              { label: 'EVENT', sub: 'Modbus Write' },
              { label: 'ASSET', sub: 'PLC-01' },
              { label: 'BEHAVIOR', sub: 'Unsigned FC06' },
              { label: 'THREAT', sub: 'MITRE T0831' },
              { label: 'PROCESS', sub: 'Drive Motor' },
              { label: 'IMPACT', sub: '90 % Overspeed' },
              { label: 'ACTION', sub: 'Setpoint Restore' },
            ].map((node) => (
              <div key={node.label} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                <span className="font-bold text-slate-900">{node.label}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">{node.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PALE BLUE - Cyber → Process Correlation */}
      <section className="bg-[#EBF2FE]/60 py-20 px-4 sm:px-6 lg:px-8 border-b border-blue-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold text-[#1769FF] uppercase tracking-wider block mb-2">
              DETERMINISTIC CORRELATION
            </span>
            <h2 className="text-3xl font-bold text-[#0B1220] tracking-tight">
              Bridges Ethernet DPI with Shaft Encoder Telemetry
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
              When an attacker executes a Modbus Write Single Register (Function Code 06) to alter speed setpoint R40003, 
              network sensors detect the packet in under 2ms. PermiSense watches input register R30001 (Actual Speed) to verify physical plant deviation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1769FF] flex items-center justify-center font-mono font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 font-mono">Modbus DPI Capture</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Passively reconstructs protocol frames on port 502. Identifies function codes, source IPs, target holding registers, and unapproved payload values without disrupting industrial communications.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1769FF] flex items-center justify-center font-mono font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 font-mono">Physical Sensor Correlation</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Continuously tracks actual actuator telemetry (shaft speed, motor current, mechanical load). Flags process deviations that cross calibrated operating thresholds within temporal correlation windows.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1769FF] flex items-center justify-center font-mono font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 font-mono">MITRE ATT&CK for ICS</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Maps correlated events to authoritative industrial adversary techniques such as T0831 (Manipulation of Control) and T1692.001 (Unauthorized Command Message).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: DARK ENGINEERING - Architecture & System Layers */}
      <section className="bg-[#09111A] text-white py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#1769FF] uppercase tracking-widest">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Layered Cyber-Physical Defense Pipeline
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-sans">
              From raw Ethernet frames to verified physical recovery, every component maintains deterministic traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono text-[#1769FF] font-semibold">LAYER 01 / FIELD</div>
              <div className="text-sm font-bold text-slate-100 font-mono">Virtual PLC & Drives</div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Modbus/TCP server hosting discrete coils, holding registers, and analog input registers with physics-consistent conveyor motor simulation.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono text-[#1769FF] font-semibold">LAYER 02 / NETWORK</div>
              <div className="text-sm font-bold text-slate-100 font-mono">Passive DPI Gateway</div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Non-intrusive Ethernet frame inspection parsing Modbus transactions, maintaining baseline registers and flagging unverified change tickets.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono text-[#1769FF] font-semibold">LAYER 03 / CORRELATION</div>
              <div className="text-sm font-bold text-slate-100 font-mono">Incident & Risk Engine</div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Temporal correlation matching control changes to physical sensor deviations, calculating backend-authoritative operational risk scores (0–100).
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono text-[#1769FF] font-semibold">LAYER 04 / RESPONSE</div>
              <div className="text-sm font-bold text-slate-100 font-mono">Human Approval Gate</div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Strict allowlisted remediation requiring authenticated operator signoff before executing writeback and conducting readback recovery verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHITE - Industry 5.0 */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#1769FF] uppercase tracking-widest">
              PERMISENSE × INDUSTRY 5.0
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220]">
              Cyber resilience for the human-centered factory
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans">
              Industry 5.0 re-evaluates technological efficiency through the lens of human agency, systemic resilience, and sustainable operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1769FF] uppercase">
                <Lock className="w-4 h-4" />
                HUMAN-CENTRIC
              </div>
              <h3 className="text-base font-bold text-slate-900">Operator Stays in Command</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Consequential industrial control decisions are never surrendered to black-box autonomous agents. 
                AI synthesizes evidence briefs, while explicit human approval is mandatory for all remediation writebacks.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#18875B] uppercase">
                <Activity className="w-4 h-4" />
                RESILIENT
              </div>
              <h3 className="text-base font-bold text-slate-900">Physical Verification of Recovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Resilience is not measured by alerts cleared; it is measured by operational normalcy restored. 
                PermiSense requires sensor readback verification before marking an incident recovered.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 uppercase">
                <Cpu className="w-4 h-4" />
                SUSTAINABLE
              </div>
              <h3 className="text-base font-bold text-slate-900">Hardware-Independent Prototype</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                A protocol-real virtual industrial runtime enables rigorous reproducible security research, 
                testing, and operator training without risking high-voltage machinery or wasting physical plant hardware.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PALE GREEN - Human-in-the-Loop Response Gate */}
      <section className="bg-[#EBF7F0]/60 py-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-100">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="text-xs font-mono font-bold tracking-widest text-[#18875B] uppercase">
            CONTROLLED INDUSTRIAL SAFETY
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220]">
            Allowlisted Response Gate with Mandatory Human Authorization
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            When an overspeed attack manipulates setpoint R40003 from 50 to 90 %, the response engine prepares a targeted remediation plan: restore R40003 to 50 %. The command cannot fire until an authorized operator clicks Approve.
          </p>

          <div className="max-w-md mx-auto bg-white border border-emerald-200 rounded-xl p-6 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                HUMAN APPROVAL REQUIRED
              </span>
              <span className="text-slate-500">Target: R40003</span>
            </div>

            <div className="text-sm font-semibold text-slate-800">
              Restore Modbus Speed Setpoint
            </div>

            <div className="flex items-center justify-between font-mono text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-red-600 font-bold">90 %</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-[#18875B] font-bold">50 %</span>
            </div>

            <button
              onClick={onNavigateToConsole}
              className="w-full py-2.5 rounded-lg bg-[#18875B] hover:bg-emerald-700 text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors"
            >
              Inspect Response Gate
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 7: PALE RED/AMBER - Incident → Impact → Response */}
      <section className="bg-red-50/40 py-20 px-4 sm:px-6 lg:px-8 border-b border-red-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1 space-y-3">
            <span className="text-xs font-mono font-bold text-[#D14343] uppercase tracking-wider">
              REAL ATTACK ANATOMY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              From Register Write to Physical Overspeed
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Watch an attack progress through real Modbus/TCP packets to physical deviation and verified recovery in the Demo Lab.
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-red-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">01. INJECTION</span>
              <div className="text-xs font-bold text-slate-900 font-mono">Modbus FC06 Write</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Adversary sends packet setting R40003 to 90 % without change ticket.
              </p>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-mono text-red-600 block mb-1">02. DEVIATION</span>
              <div className="text-xs font-bold text-red-900 font-mono">Actual Speed 90 %</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Shaft encoder R30001 exceeds 75 % ceiling. Risk calculated at 84/100.
              </p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-mono text-[#18875B] block mb-1">03. REMEDIATION</span>
              <div className="text-xs font-bold text-slate-900 font-mono">Readback Recovery</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Human authorizes setpoint restore; sensor confirms speed settles to 50 %.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: LIGHT BLUE - Live Demo Lab Preview */}
      <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="text-xs font-mono font-bold text-[#1769FF] uppercase tracking-wider">
            INTERACTIVE PROTOCOL-REAL DEMO LAB
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Designed for Hackathon Technical Evaluation
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Judges can trigger unauthorized speed changes and mode overrides with a single click, observing real-time Modbus DPI, deterministic detection, and telemetry recovery.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateToDemo}
              className="px-6 py-3 rounded-xl bg-[#0B1220] hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 mx-auto transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#1769FF]" />
              Launch Protocol-Real Demo Lab
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 10: Final CTA */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] font-mono">
          DETECT THE THREAT. TRACE THE IMPACT. DECIDE THE RESPONSE.
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto font-sans leading-relaxed">
          Experience the full cyber-physical incident lifecycle on real Modbus/TCP protocols.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateToConsole}
            className="px-6 py-3.5 rounded-xl bg-[#1769FF] hover:bg-[#1359dc] text-white text-sm font-semibold transition-all shadow-md"
          >
            Open Command Center
          </button>
          <button
            onClick={onNavigateToDemo}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-mono font-medium border border-slate-300 transition-all shadow-xs"
          >
            Run Live Demo
          </button>
        </div>
      </section>
    </div>
  );
}
