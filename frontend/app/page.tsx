'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SiteHeader } from '@/components/site-header';
import { LandingView } from '@/components/landing-view';
import { CommandCenter } from '@/components/command-center';
import { ProcessVisualization } from '@/components/process-visualization';
import { IncidentsView } from '@/components/incidents-view';
import { IncidentInvestigation } from '@/components/incident-investigation';
import { ResponseGate } from '@/components/response-gate';
import { CopilotPanel } from '@/components/copilot-panel';
import { DemoLab } from '@/components/demo-lab';
import { LiveEventStream } from '@/components/live-event-stream';

import { useSystemStatus } from '@/hooks/use-system-status';
import { useDemoStatus } from '@/hooks/use-demo-status';
import { useIncidents } from '@/hooks/use-incidents';
import { useLiveEvents } from '@/hooks/use-live-events';
import { apiClient, ApiError } from '@/lib/api';
import type { IncidentDetail, IncidentStatus, ResponsePlan } from '@/lib/types';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<IncidentDetail | null>(null);
  const [selectedResponsePlan, setSelectedResponsePlan] = useState<ResponsePlan | null>(null);
  const [loadingIncidentDetail, setLoadingIncidentDetail] = useState(false);

  // Authoritative real hooks
  const { status: systemStatus, error: systemError, refetch: refetchSystem } = useSystemStatus();
  const { data: demoStatus, error: demoError, refetch: refetchDemo } = useDemoStatus(1500);
  const { incidents, loading: loadingIncidents, refetch: refetchIncidents } = useIncidents(2000);
  const { events, connectionState, refresh: refreshEvents } = useLiveEvents(50);

  // If an incident is selected or newly created, load its detail
  const loadIncidentDetail = useCallback(async (id: string) => {
    setLoadingIncidentDetail(true);
    try {
      // Incident evidence is the primary surface. A response-plan failure must
      // never make the investigation page disappear.
      const detail = await apiClient.getIncident(id);
      setSelectedIncidentDetail(detail);

      try {
        const responsePlan = await apiClient.getResponsePlan(id);
        setSelectedResponsePlan(responsePlan);
      } catch (responseError) {
        console.error('Response plan unavailable:', responseError);
        setSelectedResponsePlan(null);
      }
    } catch (detailError) {
      console.error('Incident detail unavailable:', detailError);
      setSelectedIncidentDetail(null);
      setSelectedResponsePlan(null);
    } finally {
      setLoadingIncidentDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIncidentId) {
      loadIncidentDetail(selectedIncidentId);
    }
  }, [selectedIncidentId, loadIncidentDetail]);

  // If no incident selected but incidents exist, auto-select the latest
  useEffect(() => {
    if (!selectedIncidentId && incidents.length > 0) {
      setSelectedIncidentId(incidents[0].incident_id);
    }
  }, [incidents, selectedIncidentId]);

  const handleNavigate = (view: string, incidentId?: string) => {
    if (incidentId) {
      setSelectedIncidentId(incidentId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateIncidentStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    try {
      await apiClient.updateIncidentStatus(incidentId, newStatus);
      await refetchIncidents();
      if (selectedIncidentId === incidentId) {
        await loadIncidentDetail(incidentId);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleRefreshAll = () => {
    refetchSystem();
    refetchDemo();
    refetchIncidents();
    refreshEvents();
    if (selectedIncidentId) {
      loadIncidentDetail(selectedIncidentId);
    }
  };

  const isAlert =
    demoStatus && demoStatus.process !== 'unavailable'
      ? demoStatus.process.speed > demoStatus.controls.overspeed_limit
      : false;
  const backendError = systemError || demoError;

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#0B1220] flex flex-col">
      {/* Top Bar Contract (Brand wordmark, Nav Links, Actions) */}
      <SiteHeader
        currentView={currentView}
        onNavigate={(v) => handleNavigate(v)}
        systemStatus={systemStatus}
        backendError={backendError}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            onNavigateToConsole={() => handleNavigate('command-center')}
            onNavigateToDemo={() => handleNavigate('demo-lab')}
            actualSpeed={
              demoStatus && demoStatus.process !== 'unavailable'
                ? demoStatus.process.speed
                : 50
            }
            isAlert={isAlert}
          />
        )}

        {currentView !== 'landing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* View Switching Navigation Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs text-xs font-mono">
              {[
                { id: 'command-center', label: 'Command Center' },
                { id: 'live-process', label: 'Live Process' },
                { id: 'incidents', label: `Incidents (${incidents.length})` },
                { id: 'incident-detail', label: 'Investigation' },
                { id: 'response', label: 'Response Gate' },
                { id: 'copilot', label: 'Evidence Copilot' },
                { id: 'demo-lab', label: 'Demo Lab' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    currentView === tab.id
                      ? 'bg-[#1769FF] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View: Command Center */}
            {currentView === 'command-center' && (
              <div className="space-y-6">
                <CommandCenter
                  systemStatus={systemStatus}
                  demoStatus={demoStatus}
                  incidents={incidents}
                  latestEvents={events}
                  connectionState={connectionState}
                  onNavigateToIncident={(id) => handleNavigate('incident-detail', id)}
                  onNavigateToView={(v) => handleNavigate(v)}
                  onTriggerDemoScenario={() => handleNavigate('demo-lab')}
                />
                <LiveEventStream
                  events={events}
                  connectionState={connectionState}
                  onRefresh={refreshEvents}
                  maxDisplay={15}
                />
              </div>
            )}

            {/* View: Live Process */}
            {currentView === 'live-process' && (
              <div className="space-y-6">
                <ProcessVisualization demoStatus={demoStatus} />
                <LiveEventStream
                  events={events}
                  connectionState={connectionState}
                  onRefresh={refreshEvents}
                  maxDisplay={15}
                />
              </div>
            )}

            {/* View: Incidents Queue */}
            {currentView === 'incidents' && (
              <IncidentsView
                incidents={incidents}
                loading={loadingIncidents}
                onSelectIncident={(id) => handleNavigate('incident-detail', id)}
                onRefresh={refetchIncidents}
                onTriggerDemo={() => handleNavigate('demo-lab')}
              />
            )}

            {/* View: Incident Investigation */}
            {currentView === 'incident-detail' && (
              <IncidentInvestigation
                incident={selectedIncidentDetail}
                responsePlan={selectedResponsePlan}
                loading={loadingIncidentDetail}
                onNavigateToResponse={(id) => handleNavigate('response', id)}
                onUpdateStatus={handleUpdateIncidentStatus}
              />
            )}

            {/* View: Response Gate */}
            {currentView === 'response' && (
              selectedIncidentId ? (
                <ResponseGate
                  incidentId={selectedIncidentId}
                  responsePlan={selectedResponsePlan}
                  onResponseUpdated={handleRefreshAll}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-sm">
                  No incident is selected. Open an incident from the Incident Queue before entering the Response Gate.
                </div>
              )
            )}

            {/* View: Evidence Copilot */}
            {currentView === 'copilot' && (
              selectedIncidentId ? (
                <CopilotPanel incidentId={selectedIncidentId} />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-sm">
                  No incident is selected. Open an incident from the Incident Queue before using Evidence Copilot.
                </div>
              )
            )}

            {/* View: Demo Lab */}
            {currentView === 'demo-lab' && (
              <DemoLab
                demoStatus={demoStatus}
                incidents={incidents}
                onNavigateToIncident={(id) => handleNavigate('incident-detail', id)}
                onNavigateToResponse={(id) => handleNavigate('response', id)}
                onRefresh={handleRefreshAll}
              />
            )}
          </div>
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PERMISENSE</span>
            <span>·</span>
            <span>Cyber-Physical Incident Intelligence & Response</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Protocol-Real Virtual Industrial Cell</span>
            <span>·</span>
            <span>Passive Modbus/TCP Gateway (Port 502)</span>
            <span>·</span>
            <span>OpenAPI 3.1 Contract</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
