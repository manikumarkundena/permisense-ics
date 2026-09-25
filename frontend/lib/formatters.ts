import { PROCESS_STATE_MAP, type ProcessStateCode, type IncidentSeverity } from './types';

export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) +
      '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return isoString;
  }
}

export function formatProcessState(code: number | undefined): string {
  if (code === undefined || code === null) return '—';
  return PROCESS_STATE_MAP[code as ProcessStateCode] || `STATE_${code}`;
}

export function getSeverityBadgeClass(severity: IncidentSeverity | string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-[#D14343] bg-red-50 border-red-200';
    case 'HIGH':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'MEDIUM':
      return 'text-amber-600 bg-amber-50/50 border-amber-100';
    case 'LOW':
      return 'text-slate-600 bg-slate-50 border-slate-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'RECOVERED':
    case 'CLOSED':
    case 'HEALTHY':
    case 'ONLINE':
      return 'text-[#18875B] bg-emerald-50 border-emerald-200';
    case 'CONTAINED':
    case 'INVESTIGATING':
    case 'WARNING':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'OPEN':
    case 'ALERT':
    case 'DEGRADED':
    case 'FAULT':
      return 'text-[#D14343] bg-red-50 border-red-200';
    default:
      return 'text-slate-600 bg-slate-100 border-slate-200';
  }
}
