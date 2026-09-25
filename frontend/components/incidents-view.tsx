'use client';

import React, { useState } from 'react';
import type { IncidentSummary } from '@/lib/types';
import { formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/formatters';
import { ShieldAlert, ArrowRight, Filter, Search, RefreshCw } from 'lucide-react';

interface IncidentsViewProps {
  incidents: IncidentSummary[];
  loading?: boolean;
  onSelectIncident: (incidentId: string) => void;
  onRefresh?: () => void;
  onTriggerDemo?: () => void;
}

export function IncidentsView({
  incidents,
  loading,
  onSelectIncident,
  onRefresh,
  onTriggerDemo,
}: IncidentsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incident_id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.asset_id.toLowerCase().includes(q) ||
        (inc.process_name ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D14343]" />
              CORRELATED CYBER-PHYSICAL INCIDENT QUEUE
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Persisted incident evidence derived from Modbus/TCP control anomalies and physical sensor deviations. Historical records remain visible for auditability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 hover:text-slate-900 bg-white transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Queue
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">SEVERITY:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-mono">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterSeverity === sev
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, asset, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-mono pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769FF] text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Incident Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400">
            LOADING INCIDENT QUEUE...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-mono text-slate-500">No correlated incidents</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
              No recorded cyber-physical incidents match the selected filter. Trigger a demonstration attack scenario to generate correlated telemetry.
            </p>
            {onTriggerDemo && (
              <button
                onClick={onTriggerDemo}
                className="px-4 py-2 rounded-lg bg-[#1769FF] text-white text-xs font-mono font-medium hover:bg-[#1359dc] transition-colors"
              >
                Launch Demo Lab to Simulate Incident
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc.incident_id)}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {inc.incident_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        getSeverityBadgeClass(inc.severity)
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        getStatusBadgeClass(inc.status)
                      }`}
                    >
                      {inc.status}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-mono text-slate-500">{formatDate(inc.timestamp)}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-800">{inc.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 font-sans">{inc.summary}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                    <span>Asset: <strong className="text-slate-800">{inc.asset_id}</strong></span>
                    <span>·</span>
                    <span>Process: <strong className="text-slate-800">{inc.process_name}</strong></span>
                    <span>·</span>
                    <span>
                      Risk Score: <strong className="text-red-600">{inc.risk_score} / 100</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#1769FF] flex items-center gap-1">
                    Investigate Evidence <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
