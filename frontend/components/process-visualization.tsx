'use client';

import React from 'react';
import type { DemoStatusResponse } from '@/lib/types';
import { formatProcessState, getStatusBadgeClass } from '@/lib/formatters';
import { Activity, Cpu, Gauge, Zap, AlertTriangle, CheckCircle, Disc } from 'lucide-react';

interface ProcessVisualizationProps {
  demoStatus: DemoStatusResponse | null;
  loading?: boolean;
}

export function ProcessVisualization({ demoStatus, loading }: ProcessVisualizationProps) {
  if (loading && !demoStatus) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
        CONNECTING TO INDUSTRIAL CELL...
      </div>
    );
  }

  if (!demoStatus) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
        Industrial Cell Telemetry Unavailable. Backend offline or awaiting connection.
      </div>
    );
  }

  const { process, controls, plc } = demoStatus;
  if (process === 'unavailable' || !controls) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
        Virtual PLC connected, but process registers are currently unavailable.
      </div>
    );
  }
  const formatMetric = (value: number | undefined, digits = 1) =>
    Number.isFinite(value) ? Number(value).toFixed(digits).replace(/\.0+$/, '') : '—';

  const isOverspeed = process.speed > controls.overspeed_limit;
  const isDegraded = process.state === 3 || isOverspeed;
  const stateLabel = process.state_label ?? formatProcessState(process.state);

  return (
    <div className="space-y-6">
      {/* Top Industrial Architecture Flow Diagram */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1769FF]" />
            <h2 className="text-sm font-bold tracking-tight text-[#0B1220] uppercase font-mono">
              Virtual Industrial Cell Topology (Protocol-Real · Modbus/TCP)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Cycle: {plc.cycle_time_ms ?? '—'}ms</span>
            <span>·</span>
            <span>Scans: {plc.scans_completed?.toLocaleString() ?? '—'}</span>
          </div>
        </div>

        {/* Node Flow Chain */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* PLC-01 */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500">ASSET / PLC</span>
              <Cpu className="w-4 h-4 text-[#1769FF]" />
            </div>
            <div className="text-sm font-bold text-slate-900">{plc.id}</div>
            <div className="text-xs font-mono text-slate-500">{plc.host}:{plc.port}</div>
            <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              {plc.connection}
            </div>
          </div>

          {/* Bus Connection */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500">FIELD PROTOCOL</span>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-slate-900">{plc.protocol}</div>
            <div className="text-xs text-slate-500">Port 5020 / Passive Gateway DPI</div>
            <div className="mt-2 text-[11px] font-mono text-slate-600">
              Holding Regs: R40001–R40005, R40010–R40013
            </div>
          </div>

          {/* Motor / Drive */}
          <div className={`border rounded-lg p-3 ${isDegraded ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500">ACTUATOR / MOTOR</span>
              <Zap className={`w-4 h-4 ${isDegraded ? 'text-[#D14343]' : 'text-amber-500'}`} />
            </div>
            <div className="text-sm font-bold text-slate-900">VFD-01 Inverter</div>
            <div className="text-xs font-mono text-slate-500">Setpoint: R40003 = {formatMetric(controls.speed_setpoint)} %</div>
            <div className="mt-2 text-[11px] font-mono text-slate-700">
              Current: {formatMetric(process.current)} A ({formatMetric(process.load)}%)
            </div>
          </div>

          {/* Conveyor */}
          <div className={`border rounded-lg p-3 ${isDegraded ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500">PROCESS STATE</span>
              {isDegraded ? (
                <AlertTriangle className="w-4 h-4 text-[#D14343]" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#18875B]" />
              )}
            </div>
            <div className="text-sm font-bold text-slate-900">Conveyor Assembly</div>
            <div className="text-xs font-mono text-slate-500">Encoder: R30001 = {formatMetric(process.speed)} %</div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${getStatusBadgeClass(stateLabel)}`}>
                R30007: {process.state} — {stateLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Process Metrics Grid (R30001 - R30007) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* R30001: Actual Speed */}
        <div className={`bg-white border rounded-xl p-4 shadow-sm ${isOverspeed ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">R30001 · INPUT REG</span>
            <Gauge className={`w-4 h-4 ${isOverspeed ? 'text-[#D14343]' : 'text-[#1769FF]'}`} />
          </div>
          <div className="text-xs text-slate-600 font-medium">Actual Speed (Shaft Encoder)</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold tabular-nums ${isOverspeed ? 'text-[#D14343]' : 'text-[#0B1220]'}`}>
              {formatMetric(process.speed)}
            </span>
            <span className="text-xs font-mono text-slate-500">%</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Safety Limit: {controls.overspeed_limit} %</span>
            <span className={isOverspeed ? 'text-[#D14343] font-bold' : 'text-[#18875B]'}>
              {isOverspeed ? 'OVERSPEED' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* R30002: Motor Current */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">R30002 · INPUT REG</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xs text-slate-600 font-medium">Motor Current Feedback</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#0B1220]">
              {formatMetric(process.current)}
            </span>
            <span className="text-xs font-mono text-slate-500">A</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            Nominal: 4.2 A · Thermal Trip: 12.0 A
          </div>
        </div>

        {/* R30003: Motor Load */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">R30003 · INPUT REG</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xs text-slate-600 font-medium">Drive Mechanical Load</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#0B1220]">
              {formatMetric(process.load)}
            </span>
            <span className="text-xs font-mono text-slate-500">%</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            Ceiling Threshold: {formatMetric(controls.high_load_limit)}%
          </div>
        </div>

        {/* R30004: Position & Workpieces */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">R30004 / R30005</span>
            <Disc className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xs text-slate-600 font-medium">Conveyor Belt Linear Position</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#0B1220]">
              {formatMetric(process.position)}
            </span>
            <span className="text-xs font-mono text-slate-500">%</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500">
            Workpieces (R30005): {Number.isFinite(process.workpieces) ? process.workpieces.toLocaleString() : '—'} units
          </div>
        </div>
      </div>

      {/* Holding Registers Table (R40001 - R40009) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Modbus/TCP Holding Registers (Read/Write Controls · R40001–R40005, R40010–R40013)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Config Version: v{controls.config_version}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">REGISTER</th>
                <th className="py-2.5 px-4 font-semibold">DESCRIPTION</th>
                <th className="py-2.5 px-4 font-semibold">VALUE</th>
                <th className="py-2.5 px-4 font-semibold">NOMINAL / BOUND</th>
                <th className="py-2.5 px-4 font-semibold">INTEGRITY STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-bold text-slate-900">R40001</td>
                <td className="py-2.5 px-4 font-sans">Motor Enable State</td>
                <td className="py-2.5 px-4 font-bold">{controls.motor_enable ? '1 (ENABLED)' : '0 (DISABLED)'}</td>
                <td className="py-2.5 px-4 text-slate-500">1 (Enabled)</td>
                <td className="py-2.5 px-4 text-[#18875B] font-semibold">NOMINAL</td>
              </tr>
              <tr className={`hover:bg-slate-50/50 ${controls.operating_mode !== 1 ? 'bg-amber-50/60' : ''}`}>
                <td className="py-2.5 px-4 font-bold text-slate-900">R40002</td>
                <td className="py-2.5 px-4 font-sans">Operating Mode (Auto / Manual)</td>
                <td className="py-2.5 px-4 font-bold">
                  {controls.operating_mode} ({controls.operating_mode === 1 ? 'Auto' : controls.operating_mode === 2 ? 'Program' : controls.operating_mode === 0 ? 'Stop' : 'Unknown'})
                </td>
                <td className="py-2.5 px-4 text-slate-500">1 (Auto)</td>
                <td className={`py-2.5 px-4 font-semibold ${controls.operating_mode === 1 ? 'text-[#18875B]' : 'text-amber-700'}`}>
                  {controls.operating_mode === 1 ? 'NOMINAL' : 'MODIFIED OUTSIDE TICKET'}
                </td>
              </tr>
              <tr className={`hover:bg-slate-50/50 ${controls.speed_setpoint > controls.overspeed_limit ? 'bg-red-50/60' : ''}`}>
                <td className="py-2.5 px-4 font-bold text-slate-900">R40003</td>
                <td className="py-2.5 px-4 font-sans">Conveyor Speed Setpoint</td>
                <td className={`py-2.5 px-4 font-bold text-sm ${controls.speed_setpoint > controls.overspeed_limit ? 'text-[#D14343]' : 'text-slate-900'}`}>
                  {controls.speed_setpoint} %
                </td>
                <td className="py-2.5 px-4 text-slate-500">50 % (Ceiling: {controls.overspeed_limit} %)</td>
                <td className={`py-2.5 px-4 font-semibold ${controls.speed_setpoint > controls.overspeed_limit ? 'text-[#D14343]' : 'text-[#18875B]'}`}>
                  {controls.speed_setpoint > controls.overspeed_limit ? 'UNAUTHORIZED OVERRIDE' : 'NOMINAL'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-bold text-slate-900">R40004</td>
                <td className="py-2.5 px-4 font-sans">Acceleration Rate Limit</td>
                <td className="py-2.5 px-4 font-bold">{controls.acceleration_limit} %/s</td>
                <td className="py-2.5 px-4 text-slate-500">Configured limit</td>
                <td className="py-2.5 px-4 text-[#18875B] font-semibold">NOMINAL</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-bold text-slate-900">R40010</td>
                <td className="py-2.5 px-4 font-sans">Critical Overspeed Limit</td>
                <td className="py-2.5 px-4 font-bold">{controls.overspeed_limit} %</td>
                <td className="py-2.5 px-4 text-slate-500">Configured limit</td>
                <td className="py-2.5 px-4 text-[#18875B] font-semibold">INTERLOCK ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-bold text-slate-900">R40011</td>
                <td className="py-2.5 px-4 font-sans">High Load Ceiling Threshold</td>
                <td className="py-2.5 px-4 font-bold">{controls.high_load_limit}%</td>
                <td className="py-2.5 px-4 text-slate-500">Configured limit</td>
                <td className="py-2.5 px-4 text-[#18875B] font-semibold">INTERLOCK ACTIVE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
