"use client";

import { AlertTriangle, CheckCircle2, LockKeyhole, Play, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { Incident, RecoveryResult, ResponseExecution, ResponsePlan } from "@/types/industrial";

export default function ResponsePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [plan, setPlan] = useState<ResponsePlan | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const { correlationVersion } = useLiveEvents();

  const incident =
    incidents.find((item) => item.incident_id === selectedIncidentId) ??
    incidents[0] ??
    null;

  const loadIncidents = () =>
    api<{ count: number; incidents: Incident[] }>("/api/incidents")
      .then((result) => {
        setIncidents(result.incidents);
        setSelectedIncidentId((current) =>
          current && result.incidents.some((item) => item.incident_id === current)
            ? current
            : result.incidents[0]?.incident_id ?? "",
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load incidents"));

  const loadPlan = (incidentId: string) =>
    api<ResponsePlan>("/api/incidents/" + incidentId + "/response")
      .then(setPlan)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load response plan"));

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (correlationVersion > 0) {
      loadIncidents();
    }
  }, [correlationVersion]);

  useEffect(() => {
    if (incident) {
      loadPlan(incident.incident_id);
    } else {
      setPlan(null);
    }
  }, [incident?.incident_id]);

  async function approve() {
    if (!incident || !rec) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const result = await api<ResponseExecution>(
        "/api/incidents/" + incident.incident_id + "/response/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action: rec.action,
            approved_by: "operator",
          }),
        },
      );

      await loadPlan(incident.incident_id);
      setMessage(
        "Executed via " +
          String(result.response.execution_method ?? "backend") +
          " · execution " +
          String(result.response.execution_id ?? "recorded"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Response failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!incident) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const result = await api<RecoveryResult>(
        "/api/incidents/" + incident.incident_id + "/response/verify",
        { method: "POST" },
      );

      await loadPlan(incident.incident_id);
      setMessage(
        result.recovered
          ? "Recovery verified · control readback " +
            result.control_value.toFixed(1) +
            " = target " +
            result.target_value.toFixed(1)
          : "Recovery not verified · control readback " +
            result.control_value.toFixed(1) +
            " ≠ target " +
            result.target_value.toFixed(1),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  const rec = plan?.recommendations?.[0];

  return (
    <ConsoleShell>
      <div className="console-title-row">
        <div>
          <div className="section-label"><span /> CONTROLLED RESPONSE</div>
          <h1>Human-approved response</h1>
          <p>Only backend-allowlisted actions can be executed from this workspace.</p>
        </div>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={15}/>{error}</div>}

      {incidents.length > 0 && (
        <div className="response-incident-selector">
          <div>
            <span>INCIDENT CONTEXT</span>
            <strong>Select the incident whose response you are authorizing.</strong>
          </div>
          <div className="response-incident-list">
            {incidents.map((item) => (
              <button
                key={item.incident_id}
                className={item.incident_id === incident?.incident_id ? "selected" : ""}
                onClick={() => setSelectedIncidentId(item.incident_id)}
              >
                <span>{item.incident_id.slice(0, 8)}</span>
                <strong>{item.title}</strong>
                <small>{item.asset_id} · {item.status ?? "open"}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {!incident || !plan ? (
        <div className="empty-state large">
          <AlertTriangle size={30}/>
          <strong>No response plan available</strong>
          <p>Run the attack demo and create a correlated incident first.</p>
        </div>
      ) : (
        <div className="response-workspace">
          <section className="response-command">
            <div className="response-command-top">
              <span>RECOMMENDATION · {incident.incident_id.slice(0, 8)}</span>
              <LockKeyhole size={18}/>
            </div>

            <h2>{rec?.action.replaceAll("_", " ").toUpperCase()}</h2>
            <p>{rec?.description}</p>

            <div className="register-change">
              <div><small>REGISTER</small><strong>{rec?.register_address}</strong></div>
              <div><small>OBSERVED SETPOINT</small><strong>{rec?.current_value == null ? "—" : rec.current_value.toFixed(1)}</strong></div>
              <div className="arrow">→</div>
              <div><small>TARGET</small><strong>{rec?.target_value.toFixed(1)}</strong></div>
            </div>

            <div className="approval-warning">
              <AlertTriangle size={17}/>
              <div>
                <strong>HUMAN APPROVAL REQUIRED</strong>
                <span>The backend validates and executes the allowlisted Modbus response. AI cannot approve it.</span>
              </div>
            </div>

            {!plan.executed ? (
              <button className="approve-button" disabled={busy} onClick={approve}>
                <Play size={15}/> {busy ? "Executing…" : "Approve & execute"}
              </button>
            ) : (
              <div className="response-message"><CheckCircle2 size={15}/> Response executed and recorded.</div>
            )}

            {plan.executed && (
              <button className="verify-button" disabled={busy || plan.recovered} onClick={verify}>
                {plan.recovered ? <><ShieldCheck/> Recovery verified</> : <><Target/> Verify recovery</>}
              </button>
            )}

            {message && <div className="response-message">{message}</div>}
          </section>

          <section className="console-panel">
            <div className="panel-header">
              <div><span>RESPONSE LIFECYCLE</span><h2>Evidence → approval → recovery</h2></div>
              <ShieldCheck size={18}/>
            </div>
            <div className="response-lifecycle">
              <span className="done">01 Evidence</span>
              <span className={plan.approved ? "done" : ""}>02 Approval</span>
              <span className={plan.executed ? "done" : ""}>03 Execution</span>
              <span className={plan.recovered ? "done" : ""}>04 Recovery</span>
            </div>
          </section>
        </div>
      )}
    </ConsoleShell>
  );
}
