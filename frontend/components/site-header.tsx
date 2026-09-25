'use client';

import React from 'react';
import { Activity, Shield, Terminal, ArrowRight } from 'lucide-react';
import type { SystemStatusResponse } from '@/lib/types';

interface SiteHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  systemStatus: SystemStatusResponse | null;
  backendError?: string | null;
}

export function SiteHeader({
  currentView,
  onNavigate,
  systemStatus,
  backendError,
}: SiteHeaderProps) {
  const isHealthy = systemStatus?.status === 'HEALTHY';
  const isAlert = systemStatus?.status === 'ALERT';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F5F7F9]/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark (Top Bar Contract) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B1220] flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider">
              PS
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#0B1220] group-hover:text-[#1769FF] transition-colors">
                PERMISENSE
              </span>
            </div>
          </button>

          {/* Backend Status indicator */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendError
                  ? 'bg-red-500'
                  : isAlert
                  ? 'bg-amber-500 animate-pulse'
                  : isHealthy
                  ? 'bg-[#18875B]'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-600">
              {backendError
                ? 'BACKEND OFFLINE'
                : isAlert
                ? 'PROCESS DEGRADED'
                : isHealthy
                ? 'SYSTEM ONLINE'
                : 'CONNECTING...'}
            </span>
          </div>
        </div>

        {/* Zone 2: 4-6 text navigation links (Top Bar Contract) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'landing' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('command-center')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'command-center' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Command Center
          </button>
          <button
            onClick={() => onNavigate('live-process')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'live-process' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Live Process
          </button>
          <button
            onClick={() => onNavigate('incidents')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'incidents' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => onNavigate('response')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'response' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Response Gate
          </button>
          <button
            onClick={() => onNavigate('demo-lab')}
            className={`transition-colors hover:text-[#0B1220] ${
              currentView === 'demo-lab' ? 'text-[#1769FF] font-semibold' : ''
            }`}
          >
            Demo Lab
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions (Top Bar Contract) */}
        <div className="flex items-center gap-3">
          {currentView === 'landing' ? (
            <button
              onClick={() => onNavigate('command-center')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1769FF] hover:bg-[#1359dc] rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Operator Console
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase px-2 py-1 bg-slate-100 rounded border border-slate-200">
                CONSOLE: {currentView.replace('-', ' ').toUpperCase()}
              </span>
              <button
                onClick={() => onNavigate('landing')}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
              >
                Exit Console
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
