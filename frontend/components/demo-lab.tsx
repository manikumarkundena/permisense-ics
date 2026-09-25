'use client';

import React, { useState } from 'react';
import type { DemoStatusResponse, IncidentSummary } from '@/lib/types';
import { apiClient, ApiError } from '@/lib/api';
import { ProcessVisualization } from './process-visualization';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Activity,
  Layers,
  FileCheck,
} from 'lucide-react';

interface DemoLabProps {
  demoStatus: DemoStatusResponse | null;
  incidents: IncidentSummary[];
  onNavigateToIncident: (incidentId: string) => void;
  onNavigateToResponse: (incidentId: string) => void;
  onRefresh: () => void;
}

export function DemoLab({
  demoStatus,
  incidents,
  onNavigateToIncident,
  onNavigateToResponse,
  onRefresh,
}: DemoLabProps) {
  const [triggeringScenario, setTriggeringScenario] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRestoreBaseline = async () => {
    setTriggeringScenario('reset');
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await apiClient.resetDemo();
      setStatusMsg(
        `Real Modbus/TCP baseline restore executed: R40002 → 1 (RUN/Auto), R40003 → 50 %. ${res.description ?? 'Virtual PLC baseline restored.'}`
      );
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const latestIncident = incidents[0] || null;
  const activeIncident = incidents.find((incident) =>
    incident.status === 'OPEN' || incident.status === 'INVESTIGATING' || incident.status === 'CONTAINED'
  ) || null;
  const isOverspeed =
    demoStatus && demoStatus.process !== 'unavailable'
      ? demoStatus.process.speed > demoStatus.controls.overspeed_limit
      : false;
  const isAttackActive = demoStatus?.scenarios.speed_attack_active || isOverspeed;

  // Derive current step in the 10-step journey from ACTUAL backend state:
  const getStepProgress = () => {
    if (!demoStatus) return 0;
    if (!isAttackActive && incidents.length === 0) return 0; // nominal baseline

    // Prefer the currently active incident; otherwise preserve a completed
    // demo journey when the most recent recorded incident is already recovered.
    if (activeIncident) {
      if (activeIncident.status === 'RECOVERED' || activeIncident.status === 'CLOSED') {
        return 10; // 10 RECOVER
      }
      if (activeIncident.status === 'CONTAINED') {
        return 9; // 09 RESPOND
      }
      // If incident is OPEN / INVESTIGATING
      return 7; // 07 EVIDENCE reached
    }

    if (isAttackActive) {
      return 5; // IMPACT
    }

    if (latestIncident?.status === 'RECOVERED' || latestIncident?.status === 'CLOSED') {
      return 10;
    }

    return 0;
  };

  const currentStep = getStepProgress();

  const handleTriggerSpeedAttack = async () => {
    setTriggeringScenario('speed');
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await apiClient.triggerSpeedScenario();
      setStatusMsg(`Real Modbus/TCP write executed: R40003 → ${res.result?.value ?? 90}. The backend will correlate telemetry into an incident.`);
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const handleTriggerModeAttack = async () => {
    setTriggeringScenario('mode');
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await apiClient.triggerModeScenario();
      setStatusMsg(`Real Modbus/TCP write executed: R40002 → ${res.result?.value ?? 0}. The backend will correlate telemetry into an incident.`);
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const steps = [
    { num: '01', title: 'TRIGGER', desc: 'Real Modbus FC06 write' },
    { num: '02', title: 'OBSERVE', desc: 'Gateway DPI frame capture' },
    { num: '03', title: 'DETECT', desc: 'Deterministic rule engine' },
    { num: '04', title: 'CORRELATE', desc: 'Control write ↔ Telemetry' },
    { num: '05', title: 'IMPACT', desc: 'Process deviation (90 %)' },
    { num: '06', title: 'RISK', desc: 'Backend operational risk' },
    { num: '07', title: 'EVIDENCE', desc: 'Explainable graph & MITRE' },
    { num: '08', title: 'DECIDE', desc: 'Human operator approval' },
    { num: '09', title: 'RESPOND', desc: 'Allowlisted Modbus restore' },
    { num: '10', title: 'RECOVER', desc: 'Readback verification' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0B1220] text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1769FF]" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#1769FF] uppercase">
                HACKATHON PROTOCOL-REAL DEMO LAB
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Virtual Industrial Cell (Modbus/TCP + Physical Telemetry)
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
              Every action executed in this lab generates protocol-compliant Modbus/TCP frames against the virtual PLC. 
              The passive DPI gateway observes packets, models process deviation, quantifies operational risk, and verifies recovery.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTriggerSpeedAttack}
              disabled={!!triggeringScenario}
              className="px-4 py-2.5 rounded-lg bg-[#D14343] hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {triggeringScenario === 'speed' ? 'SENDING MODBUS WRITE...' : 'TRIGGER OVERSPEED ATTACK (90 %)'}
            </button>

            <button
              onClick={handleTriggerModeAttack}
              disabled={!!triggeringScenario}
              className="px-3.5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-semibold uppercase flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              Trigger Mode Override
            </button>

            <button
              onClick={handleRestoreBaseline}
              disabled={!!triggeringScenario}
              className="px-3.5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-mono font-semibold uppercase flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              {triggeringScenario === 'reset' ? 'RESTORING BASELINE...' : 'RESTORE DEMO BASELINE'}
            </button>
          </div>
        </div>

        {/* Status or error callouts */}
        {statusMsg && (
          <div className="mt-4 p-3 bg-slate-800/80 rounded-lg text-xs font-mono text-emerald-400 border border-emerald-500/30">
            ✓ {statusMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/50 rounded-lg text-xs font-mono text-red-400 border border-red-500/40">
            ✕ {errorMsg}
          </div>
        )}
      </div>

      {/* 10-Step Interactive Demo Journey Progression */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1769FF]" />
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              10-STEP HACKATHON DEMO JOURNEY (BACKEND STATE REFLECTED)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Current Stage: {currentStep === 0 ? 'NOMINAL BASELINE' : steps[currentStep - 1]?.title}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {steps.map((st, i) => {
            const stepNum = i + 1;
            const isCompleted = currentStep >= stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <div
                key={st.num}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#1769FF] text-white border-[#1769FF] shadow-sm scale-102'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-bold opacity-80 mb-0.5">{st.num}</div>
                <div className="text-xs font-bold font-mono tracking-tight">{st.title}</div>
                <div className={`text-[10px] mt-1 line-clamp-2 ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Incident & Remediation Shortcut Banner if attack is active */}
      {activeIncident && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#D14343] shrink-0" />
            <div>
              <div className="text-xs font-mono font-bold text-red-900">
                ACTIVE CORRELATED INCIDENT: {activeIncident.incident_id}
              </div>
              <div className="text-xs text-red-800 font-sans mt-0.5">
                {activeIncident.title} · Status: <span className="font-bold">{activeIncident.status}</span> · Risk: <span className="font-bold">{activeIncident.risk_score ?? (typeof activeIncident.risk?.score === 'number' ? activeIncident.risk.score : '—')}/100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToIncident(activeIncident.incident_id)}
              className="px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-xs font-mono font-medium hover:bg-red-100/50 transition-colors"
            >
              Investigate Evidence
            </button>
            <button
              onClick={() => onNavigateToResponse(activeIncident.incident_id)}
              className="px-3.5 py-1.5 rounded-lg bg-[#D14343] hover:bg-red-700 text-white text-xs font-mono font-bold transition-colors"
            >
              Authorize Remediation →
            </button>
          </div>
        </div>
      )}

      {/* Live Industrial Process Visualization */}
      <ProcessVisualization demoStatus={demoStatus} />
    </div>
  );
}
