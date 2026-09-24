"use client";

import { Bot, CheckCircle2, CircleAlert, Send, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { Incident } from "@/types/industrial";

type CopilotResult = {
  incident_id: string;
  grounded: boolean;
  copilot: {
    summary: string;
    evidence: string[] | string;
    impact: string;
    recommended_action: string;
    confidence_note: string;
  };
};

export default function CopilotPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { correlationVersion } = useLiveEvents();

  const load = () =>
    api<{ count: number; incidents: Incident[] }>("/api/incidents")
      .then((r) => {
        setIncidents(r.incidents);
        setSelectedIncidentId((current) =>
          current && r.incidents.some((item) => item.incident_id === current)
            ? current
            : r.incidents[0]?.incident_id ?? "",
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load incidents"));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (correlationVersion > 0) load();
  }, [correlationVersion]);

  useEffect(() => {
    setResult(null);
  }, [selectedIncidentId]);

  const incident =
    incidents.find((item) => item.incident_id === selectedIncidentId) ??
    incidents[0] ??
    null;

  async function run() {
    if (!incident) return;
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<CopilotResult>(
          "/api/incidents/" + incident.incident_id + "/copilot",
          { method: "POST" },
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copilot request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConsoleShell>
      <div className="console-title-row">
        <div>
          <div className="section-label"><span /> EVIDENCE-GROUNDED COPILOT</div>
          <h1>Explain the incident</h1>
          <p>Copilot receives persisted incident evidence. It does not determine whether an event is malicious and cannot approve a response.</p>
        </div>
      </div>

      {!incident ? (
        <div className="empty-state large">
          <Bot size={30}/>
          <strong>No incident evidence available</strong>
          <p>Create a real correlated incident first.</p>
        </div>
      ) : (
        <div className="copilot-workspace">
          <section className="copilot-command console-panel">
            <div className="panel-header">
              <div><span>SELECTED INCIDENT</span><h2>{incident.title}</h2></div>
              <ShieldAlert size={18}/>
            </div>

            <div className="response-incident-list">
              {incidents.map((item) => (
                <button
                  key={item.incident_id}
                  className={item.incident_id === incident.incident_id ? "selected" : ""}
                  onClick={() => setSelectedIncidentId(item.incident_id)}
                >
                  <span>{item.incident_id.slice(0, 8)}</span>
                  <strong>{item.title}</strong>
                  <small>{item.asset_id} · {item.status ?? "open"}</small>
                </button>
              ))}
            </div>

            <div className="copilot-evidence-strip">
              <span>{incident.asset_id}</span>
              <span>{incident.severity}</span>
              <span>{incident.incident_id.slice(0, 8)}</span>
            </div>

            <button className="approve-button" disabled={busy} onClick={run}>
              <Send size={15}/>{busy ? "Analyzing supplied evidence…" : "Analyze with evidence-grounded copilot"}
            </button>

            {error && <div className="error-banner"><CircleAlert size={14}/>{error}</div>}
          </section>

          {result && (
            <section className="copilot-result">
              <div className="grounded-banner">
                <CheckCircle2 size={15}/>
                <strong>GROUNDED INPUT</strong>
                <span>Response generated from the incident evidence supplied to the model.</span>
              </div>
              <article className="copilot-answer">
                <span>SUMMARY</span>
                <h2>{result.copilot.summary}</h2>
              </article>
              <div className="copilot-answer-grid">
                <article className="copilot-answer"><span>EVIDENCE</span><p>{Array.isArray(result.copilot.evidence) ? result.copilot.evidence.join(" · ") : result.copilot.evidence}</p></article>
                <article className="copilot-answer"><span>IMPACT</span><p>{result.copilot.impact}</p></article>
                <article className="copilot-answer"><span>RECOMMENDED ACTION</span><p>{result.copilot.recommended_action}</p></article>
                <article className="copilot-answer"><span>CONFIDENCE NOTE</span><p>{result.copilot.confidence_note}</p></article>
              </div>
            </section>
          )}
        </div>
      )}
    </ConsoleShell>
  );
}
