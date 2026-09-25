'use client';

import React, { useState } from 'react';
import type { TelemetryEvent } from '@/lib/types';
import type { StreamConnectionState } from '@/hooks/use-live-events';
import { formatTimestamp } from '@/lib/formatters';
import { Activity, ShieldAlert, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';

interface LiveEventStreamProps {
  events: TelemetryEvent[];
  connectionState: StreamConnectionState;
  onRefresh?: () => void;
  maxDisplay?: number;
}

export function LiveEventStream({
  events,
  connectionState,
  onRefresh,
  maxDisplay = 20,
}: LiveEventStreamProps) {
  const [filterChannel, setFilterChannel] = useState<string>('ALL');

  const filteredEvents = events.filter((evt) => {
    if (filterChannel === 'ALL') return true;
    return evt.channel === filterChannel;
  });

  const isConnected = connectionState === 'CONNECTED';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Stream Header */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#1769FF]" />
          <h3 className="text-sm font-semibold text-[#0B1220]">Real-Time Event Stream</h3>
          <span className="text-slate-300">·</span>
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-[#18875B]'
                  : connectionState === 'RECONNECTING' || connectionState === 'CONNECTING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-slate-600 font-medium">
              {connectionState === 'CONNECTED'
                ? 'STREAM CONNECTED'
                : connectionState === 'CONNECTING'
                ? 'CONNECTING...'
                : connectionState === 'RECONNECTING'
                ? 'RECONNECTING...'
                : 'LIVE STREAM DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-mono">
            {['ALL', 'MODBUS_DPI', 'PLC_TELEMETRY', 'RESPONSE_EXEC'].map((chan) => (
              <button
                key={chan}
                onClick={() => setFilterChannel(chan)}
                className={`px-2 py-1 rounded transition-colors ${
                  filterChannel === chan
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {chan === 'ALL' ? 'ALL' : chan.replace('_', ' ')}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Event Log"
              className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg bg-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px] font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {isConnected ? 'Awaiting telemetry events from industrial cell...' : 'Backend stream disconnected.'}
          </div>
        ) : (
          filteredEvents.slice(0, maxDisplay).map((event) => {
            const isAlert =
              event.event_type === 'OVERSPEED_ALERT' ||
              (event.event_type === 'CONTROL_WRITE' && event.value === 90);
            const isResponse = event.event_type === 'RESPONSE_APPLIED';

            return (
              <div
                key={event.event_id}
                className={`p-3 transition-colors hover:bg-slate-50/80 ${
                  isAlert
                    ? 'bg-red-50/40 border-l-2 border-l-[#D14343]'
                    : isResponse
                    ? 'bg-emerald-50/40 border-l-2 border-l-[#18875B]'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    {isAlert ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-[#D14343] shrink-0" />
                    ) : isResponse ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#18875B] shrink-0" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800">{event.event_type}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{event.channel}</span>
                    {event.register && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                        {event.register}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                <div className="text-slate-600 font-sans text-xs pl-5.5 leading-relaxed">
                  {event.message}
                </div>

                <div className="flex items-center gap-3 mt-1.5 pl-5.5 text-[11px] text-slate-400">
                  <span>Source: {event.source}</span>
                  {event.value !== undefined && (
                    <>
                      <span>·</span>
                      <span className="font-mono font-medium text-slate-700">
                        Value: {event.value} {event.unit || ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer metadata */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Recorded buffer: {events.length} events</span>
        <span>Passive Ethernet Gateway Inspection (Port 502)</span>
      </div>
    </div>
  );
}
