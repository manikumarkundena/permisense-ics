'use client';

import React, { useState } from 'react';
import type { IncidentDetail, IncidentStatus, ResponsePlan } from '@/lib/types';
import { formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/formatters';
import {
  ShieldAlert,
  ArrowRight,
  Cpu,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface IncidentInvestigationProps {
  incident: IncidentDetail | null;
  responsePlan?: ResponsePlan | null;
  loading?: boolean;
  onNavigateToResponse?: (incidentId: string) => void;
  onUpdateStatus?: (incidentId: string, newStatus: IncidentStatus) => Promise<void>;
}

export function IncidentInvestigation({
  incident,
  responsePlan = null,
  loading,
  onNavigateToResponse,
  onUpdateStatus,
}: IncidentInvestigationProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (loading && !incident) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
        LOADING INCIDENT EVIDENCE...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
        No incident selected for investigation. Select an incident from the Incident Queue.
      </div>
    );
  }

  const {
    incident_id,
    severity,
    status,
    asset,
    process,
    timestamp,
    control_change,
    process_deviation,
    detection,
    correlation,
    mitre_attack,
    operational_impact,
    risk,
    evidence_graph,
  } = incident;

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(incident_id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Incident Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono tracking-tight text-slate-900">
                {incident_id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getSeverityBadgeClass(
                  severity
                )}`}
              >
                {severity}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadgeClass(
                  status
                )}`}
              >
                {status}
              </span>
            </div>
            <h1 className="text-base font-semibold text-slate-800 mt-1">{incident.title}</h1>
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">OPERATOR STATUS:</span>
            <select
              value={status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
              className="text-xs font-mono px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1769FF]"
            >
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="CONTAINED">CONTAINED</option>
              <option value="RECOVERED">RECOVERED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        {/* Metadata Line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block mb-0.5">AFFECTED ASSET</span>
            <span className="font-semibold text-slate-800">
              {asset.name} ({asset.id})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">PROCESS NAME</span>
            <span className="font-semibold text-slate-800">{process.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">ZONE / LOCATION</span>
            <span className="text-slate-700">{asset.zone}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">DETECTED TIMESTAMP</span>
            <span className="text-slate-700">{formatDate(timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Cyber-Physical Investigation Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4 font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1769FF]" />
          CYBER-PHYSICAL EVIDENCE CHAIN
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
          {/* Step 1: Control Event */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                01. CONTROL WRITE
              </span>
              <div className="text-xs font-bold text-slate-900 mt-1 font-mono">
                {control_change.register}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">{control_change.register_name}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono text-red-600 font-bold">
              {control_change.previous_value} → {control_change.new_value} {control_change.unit}
            </div>
          </div>

          {/* Step 2: Detection */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                02. DETECTION
              </span>
              <div className="text-xs font-bold text-slate-900 mt-1 font-mono">{detection.rule_id}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">{detection.detector}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono text-[#18875B] font-bold">
              {detection.confidence}
            </div>
          </div>

          {/* Step 3: Process Deviation */}
          <div className="border border-slate-200 rounded-lg p-3 bg-red-50/40 border-red-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-red-600 uppercase">
                03. DEVIATION
              </span>
              <div className="text-xs font-bold text-red-950 mt-1 font-mono">
                {process_deviation.register}
              </div>
              <div className="text-[11px] text-red-800 mt-0.5">{process_deviation.physical_sensor}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-red-200 text-[11px] font-mono text-[#D14343] font-bold">
              Peak: {process_deviation.peak_observed} {process_deviation.unit}
            </div>
          </div>

          {/* Step 4: Correlation */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                04. CORRELATION
              </span>
              <div className="text-xs font-bold text-slate-900 mt-1 font-mono">
                Δt = {correlation.time_delta_ms == null ? 'N/A' : `${correlation.time_delta_ms}ms`}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">Window: {correlation.window_seconds == null ? 'N/A' : `${correlation.window_seconds}s`}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono text-indigo-700 font-bold">
              Causality: {correlation.causality_score == null ? 'N/A' : `${correlation.causality_score}%`}
            </div>
          </div>

          {/* Step 5: Impact */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                05. IMPACT
              </span>
              <div className="text-xs font-bold text-slate-900 mt-1 font-mono">
                {operational_impact.physical_process_state}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">Bound: {operational_impact.safe_limit} {operational_impact.unit}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono text-amber-700 font-bold">
              Obs: {operational_impact.observed_value} {operational_impact.unit}
            </div>
          </div>

          {/* Step 6: Risk */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                06. DERIVED RISK
              </span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1 tabular-nums">
                {risk.score} / 100
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">{risk.level}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
              BACKEND AUTHORITATIVE
            </div>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK for ICS Section (Section 20: Only display techniques returned by backend) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D14343]" />
            <h3 className="text-sm font-semibold text-slate-900">
              MITRE ATT&CK for Industrial Control Systems (ICS)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {mitre_attack.length} Mapped Techniques
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mitre_attack.map((mitre) => (
            <div
              key={mitre.technique_id}
              className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {mitre.technique_id}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Tactic: {mitre.tactic}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-800 mb-1">
                {mitre.technique_name}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {mitre.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Graph Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1769FF]" />
            <h3 className="text-sm font-semibold text-slate-900">
              Correlated Evidence Graph
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {evidence_graph.nodes.length} Nodes · {evidence_graph.edges.length} Causal Edges
          </span>
        </div>

        {/* Visual Graph Representation */}
        <div className="bg-[#09111A] rounded-xl p-6 border border-slate-800 overflow-x-auto">
          <div className="min-w-[650px] flex items-center justify-between gap-3 relative py-4">
            {evidence_graph.nodes.map((node, index) => {
              const isAlert = node.status === 'ALERT';
              const isWarning = node.status === 'WARNING';

              return (
                <React.Fragment key={node.id}>
                  {/* Node */}
                  <div
                    className={`rounded-lg p-3 w-40 shrink-0 border transition-all ${
                      isAlert
                        ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500/30'
                        : isWarning
                        ? 'bg-amber-950/30 border-amber-500/60'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                      {node.type}
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-mono truncate">
                      {node.label}
                    </div>
                    {node.sublabel && (
                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        {node.sublabel}
                      </div>
                    )}
                  </div>

                  {/* Connecting Edge Arrow */}
                  {index < evidence_graph.nodes.length - 1 && (
                    <div className="flex flex-col items-center justify-center shrink-0 text-slate-500">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {evidence_graph.edges[index]?.label || 'causes'}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Risk & Factors Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Backend Operational Risk Factor Breakdown
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Calculated: {formatDate(risk.calculation_timestamp)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {risk.factors.map((factor) => (
            <div
              key={factor.name}
              className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-800">{factor.name}</span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  +{factor.contributed} / {factor.weight}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#1769FF]"
                  style={{ width: `${(factor.contributed / factor.weight) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">{factor.reason}</p>
            </div>
          ))}
        </div>

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-[#1769FF] shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800">Operational Impact Summary: </strong>
            {operational_impact.summary}
          </div>
        </div>
      </div>

      {/* Response Recommendation Callout */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1">
            RECOMMENDED RESPONSE ACTION (MANDATORY HUMAN APPROVAL)
          </span>
          <div className="text-base font-semibold text-slate-100">
            {responsePlan?.recommended_action ?? 'NO RESPONSE PLAN'}: {responsePlan?.description ?? 'No response plan available.'}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            Target: {responsePlan?.register ?? 'N/A'} ({responsePlan?.current_value ?? 0} → {responsePlan?.target_value ?? 0} {responsePlan?.unit ?? ''})
          </div>
        </div>

        {onNavigateToResponse && (
          <button
            onClick={() => onNavigateToResponse(incident_id)}
            className="px-4 py-2.5 rounded-lg bg-[#1769FF] hover:bg-[#1359dc] text-white text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
          >
            Review & Authorize in Response Gate
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
