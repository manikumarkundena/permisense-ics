'use client';

import React from 'react';
import type { SystemStatusResponse, DemoStatusResponse, IncidentSummary, TelemetryEvent } from '@/lib/types';
import type { StreamConnectionState } from '@/hooks/use-live-events';
import { formatTimestamp, formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/formatters';
import {
  Server,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Play,
} from 'lucide-react';

interface CommandCenterProps {
  systemStatus: SystemStatusResponse | null;
  demoStatus: DemoStatusResponse | null;
  incidents: IncidentSummary[];
  latestEvents: TelemetryEvent[];
  connectionState: StreamConnectionState;
  onNavigateToIncident: (incidentId: string) => void;
  onNavigateToView: (view: string) => void;
  onTriggerDemoScenario: () => void;
}

export function CommandCenter({
  systemStatus,
  demoStatus,
  incidents,
  latestEvents,
  connectionState,
  onNavigateToIncident,
  onNavigateToView,
  onTriggerDemoScenario,
}: CommandCenterProps) {
  const latestIncident = incidents[0] || null;
  const activeIncidents = incidents.filter((incident) =>
    incident.status === 'OPEN' || incident.status === 'INVESTIGATING' || incident.status === 'CONTAINED'
  );
  const latestEvent = latestEvents[0] || null;
  const isHealthy = systemStatus?.status === 'HEALTHY';
  const liveProcess = demoStatus && demoStatus.process !== 'unavailable' ? demoStatus.process : null;
  const controls = demoStatus?.controls;
  const overspeedLimit = controls?.overspeed_limit;
  const isDegraded =
    !!liveProcess &&
    typeof overspeedLimit === 'number' &&
    liveProcess.speed > overspeedLimit;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PLC Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">ASSET / PLC-01</span>
            <Cpu className="w-4 h-4 text-[#1769FF]" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            {systemStatus?.components.plc.status || (demoStatus ? 'ONLINE' : 'CONNECTING...')}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            Modbus/TCP Port 502 · Virtual PLC endpoint
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            Scans: {demoStatus?.plc.scans_completed?.toLocaleString() || '—'}
          </div>
        </div>

        {/* Gateway Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">PASSIVE DPI GATEWAY</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            {systemStatus?.components.gateway.status || 'ONLINE'}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            Ethernet Tap · Stateful Parsing
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#18875B] font-semibold">
            INTERCEPTING TRAFFIC
          </div>
        </div>

        {/* Live Stream Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">REAL-TIME TELEMETRY</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {connectionState === 'CONNECTED' ? 'STREAM CONNECTED' : connectionState}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            Event Channel: /ws/events
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            Latest Sample: {latestEvent ? formatTimestamp(latestEvent.timestamp) : '—'}
          </div>
        </div>

        {/* Active Incidents Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">INCIDENTS RECORDED</span>
            <ShieldAlert className={`w-4 h-4 ${incidents.length > 0 ? 'text-[#D14343]' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold tabular-nums ${incidents.length > 0 ? 'text-[#D14343]' : 'text-slate-900'}`}>
              {incidents.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {incidents.length === 1 ? 'incident recorded' : 'incidents recorded'}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            {activeIncidents.length > 0 ? `${activeIncidents.length} active · Highest Risk: ${activeIncidents[0].risk_score ?? (typeof activeIncidents[0].risk?.score === 'number' ? activeIncidents[0].risk.score : '—')}/100` : 'No active incidents'}
          </div>
        </div>
      </div>

      {/* Cyber-Physical Intelligence Pipeline Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1769FF]" />
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              PERMISENSE CYBER-PHYSICAL PIPELINE
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            OBSERVE → DETECT → CORRELATE → IMPACT → DECIDE → RECOVER
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '01', name: 'OBSERVE', desc: 'Passive Modbus/TCP DPI Tap' },
            { step: '02', name: 'DETECT', desc: 'Deterministic Rule Inspection' },
            { step: '03', name: 'CORRELATE', desc: 'Control Write ↔ Telemetry Delay' },
            { step: '04', name: 'IMPACT', desc: 'Physical Sensor Deviation' },
            { step: '05', name: 'DECIDE', desc: 'Mandatory Human Approval Gate' },
            { step: '06', name: 'RECOVER', desc: 'Readback & Verification' },
          ].map((item) => (
            <div key={item.step} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-[10px] font-mono font-bold text-slate-400 block mb-0.5">{item.step}</span>
              <div className="text-xs font-bold font-mono text-slate-800">{item.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-tight">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Latest Incident + Process State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Incident Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D14343]" />
                <h3 className="text-sm font-semibold text-slate-900">Latest Correlated Incident</h3>
              </div>
              <button
                onClick={() => onNavigateToView('incidents')}
                className="text-xs font-mono text-[#1769FF] hover:underline flex items-center gap-1"
              >
                View All Queue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestIncident ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {latestIncident.incident_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getSeverityBadgeClass(latestIncident.severity)}`}>
                    {latestIncident.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getStatusBadgeClass(latestIncident.status)}`}>
                    {latestIncident.status}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-800">{latestIncident.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{latestIncident.summary}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100 text-slate-500">
                  <div>Asset: <span className="font-semibold text-slate-800">{latestIncident.asset_id}</span></div>
                  <div>Risk: <span className="font-bold text-red-600">{latestIncident.risk_score ?? (typeof latestIncident.risk?.score === 'number' ? latestIncident.risk.score : '—')} / 100</span></div>
                  <div>Process: <span className="text-slate-800">{latestIncident.process_name}</span></div>
                  <div>Time: <span className="text-slate-800">{formatDate(latestIncident.timestamp)}</span></div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-mono space-y-3">
                <div>NO CORRELATED INCIDENTS</div>
                <p className="text-slate-500 text-[11px] font-sans">
                  The industrial cell is operating within nominal safety thresholds.
                </p>
                <button
                  onClick={onTriggerDemoScenario}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-mono hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Trigger Demo Attack Scenario
                </button>
              </div>
            )}
          </div>

          {latestIncident && (
            <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">Human Approval Pending</span>
              <button
                onClick={() => onNavigateToIncident(latestIncident.incident_id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1769FF] hover:bg-[#1359dc] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                Investigate Incident <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Current Process Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1769FF]" />
                <h3 className="text-sm font-semibold text-slate-900">Current Industrial Process State</h3>
              </div>
              <button
                onClick={() => onNavigateToView('live-process')}
                className="text-xs font-mono text-[#1769FF] hover:underline flex items-center gap-1"
              >
                Open Full Process View <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {liveProcess ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-mono text-slate-500 block mb-1">R30001 ACTUAL SPEED</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-mono font-bold ${isDegraded ? 'text-[#D14343]' : 'text-slate-900'}`}>
                        {liveProcess.speed}
                      </span>
                      <span className="text-xs font-mono text-slate-500">%</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Setpoint: {controls?.speed_setpoint ?? '—'} %</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-mono text-slate-500 block mb-1">PROCESS STATE (R30007)</span>
                    <div className="text-base font-bold font-mono text-slate-900 mt-1">
                      {liveProcess.state_label}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Code: {liveProcess.state}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-600 pt-2 border-t border-slate-100">
                  <div>Current: <strong className="text-slate-900">{liveProcess.current} A</strong></div>
                  <div>Load: <strong className="text-slate-900">{liveProcess.load}%</strong></div>
                  <div>Parts: <strong className="text-slate-900">{liveProcess.workpieces}</strong></div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-mono">
                WAITING FOR TELEMETRY
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Safety Limit: {overspeedLimit ?? 75} %</span>
            <span className={isDegraded ? 'text-[#D14343] font-bold' : 'text-[#18875B] font-semibold'}>
              {isDegraded ? 'SAFETY CEILING EXCEEDED' : 'NOMINAL SAFETY ENVELOPE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
