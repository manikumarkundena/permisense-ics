"use client";

import { AlertTriangle, ArrowLeft, Bot, GitBranch, ShieldAlert, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import type { Incident } from "@/types/industrial";

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? v as Record<string, unknown> : {};
}

function titleFor(incident: Incident, control: Record<string, unknown>) {
  if (incident.title && !incident.title.toLowerCase().startsWith("control manipulation")) return incident.title;
  const register = Number(control.register_address);
  if (register === 40002) return "Unauthorized operating mode change";
  if (register === 40003) return "Unauthorized speed setpoint change";
  if (register === 40004) return "Unauthorized acceleration limit change";
  if (register === 40005) return "Unauthorized production target change";
  if (register >= 40010 && register <= 40012) return "Unauthorized process alarm configuration change";
  return "Industrial control change with process impact";
}

function valueText(value: unknown) {
  return value == null ? "—" : typeof value === "number" ? value.toFixed(1) : String(value);
}

function impactSummary(impact: Record<string, unknown>, processEvents: Array<Record<string, unknown>>) {
  const description = String(impact.description ?? "");
  if (description) return description;
  const state = processEvents[0]?.value;
  if (impact.impact_type === "process_stopped" || state === 0) return "The PLC process state was observed as STOPPED after the control change.";
  if (impact.impact_type === "process_degradation") return "Process telemetry demonstrated a deviation after the control change.";
  return "No detailed process-impact description was persisted.";
}

export default function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) =>
      api<Incident>(`/api/incidents/${id}`).then(setIncident).catch((e) => setError(e.message))
    );
  }, [params]);

  if (error) return <ConsoleShell><div className="error-banner"><AlertTriangle size={15}/>{error}</div><Link href="/console/incidents" className="text-link"><ArrowLeft size={14}/> Back to incidents</Link></ConsoleShell>;
  if (!incident) return <ConsoleShell><div className="empty-state large"><GitBranch size={28}/><strong>Loading incident evidence…</strong></div></ConsoleShell>;

  const risk=obj(incident.risk);
  const impact=obj(incident.impact);
  const control=obj(incident.control);
  const mappings=incident.mitre_mappings ?? [];
  const processEvents=incident.process_events ?? [];
  const title=titleFor(incident, control);
  const register=control.register_address;
  const previous=control.previous_value;
  const next=control.new_value;
  const processEvidence=processEvents[0] ?? {};
  const detection=incident.detections?.[0] ?? {};
  const detectionTitle=String(detection.title ?? detection.rule_id ?? "Detection evidence");
  const impactText=impactSummary(impact, processEvents);
  const graph=obj(incident.evidence_graph);
  const graphNodes=Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges=Array.isArray(graph.edges) ? graph.edges : [];

  return (
    <ConsoleShell>
      <div className="breadcrumb"><Link href="/console/incidents"><ArrowLeft size={14}/> Incidents</Link><span>/</span>{incident.incident_id.slice(0,8)}</div>

      <div className="incident-hero">
        <div>
          <div className="section-label"><span /> {String(incident.status ?? "OPEN").toUpperCase()} / CORRELATED INCIDENT</div>
          <h1>{title}</h1>
          <p>{incident.reason}</p>
        </div>
        <div className="risk-badge">
          <small>OPERATIONAL RISK</small>
          <strong>{String(risk.level ?? incident.severity).toUpperCase()}</strong>
          <span>{String(risk.score ?? "—")} / 100</span>
        </div>
      </div>

      <div className="investigation-grid">
        <section className="console-panel evidence-detail">
          <div className="panel-header">
            <div><span>EVENT → PROCESS → IMPACT</span><h2>Evidence chain</h2></div>
            <GitBranch size={18}/>
          </div>

          <div className="evidence-flow">
            {[
              ["01", "CONTROL EVENT", register ? "R"+String(register) : "REGISTER", previous != null || next != null ? valueText(previous)+" → "+valueText(next) : "Observed change", "threat"],
              ["02", "DETECTION", String(detection.rule_id ?? "CONTROL"), detectionTitle, "amber"],
              ["03", "PROCESS TELEMETRY", processEvidence.register_address ? "R"+String(processEvidence.register_address) : "PROCESS", valueText(processEvidence.value), "system"],
              ["04", "IMPACT", String(impact.impact_type ?? "PROCESS IMPACT").replaceAll("_"," "), impactText, "amber"],
              ["05", "RISK", String(risk.level ?? incident.severity), String(risk.score ?? "—") + " / 100", "threat"]
            ].map(([step,label,titleText,sub,tone]) => (
              <div className={"evidence-step tone-"+tone} key={step}>
                <span>{step}</span><small>{label}</small><strong>{titleText}</strong><em>{sub}</em>
                {step !== "05" && <div className="evidence-connector"/>}
              </div>
            ))}
          </div>

          <div className="evidence-facts">
            <div><span>ASSET</span><strong>{incident.asset_id}</strong></div>
            <div><span>PROCESS</span><strong>{incident.process_id}</strong></div>
            <div><span>PROTOCOL</span><strong>{String(control.protocol ?? "—")}</strong></div>
            <div><span>OBSERVED SOURCE</span><strong>{String(control.source_address ?? "—")}</strong></div>
          </div>
        </section>

        <section className="console-panel">
          <div className="panel-header"><div><span>TECHNIQUE MAPPING</span><h2>MITRE ATT&CK for ICS</h2></div><Target size={18}/></div>
          {mappings.length ? (
            <div className="mapping-list">{mappings.map((m,i)=>
              <div className="mapping-row" key={i}>
                <ShieldAlert size={15}/>
                <div><strong>{String(m.technique_id ?? m.id ?? "Technique")}</strong><small>{String(m.technique_name ?? m.name ?? m.technique ?? "")}</small></div>
              </div>
            )}</div>
          ) : <div className="empty-state"><Target size={24}/><strong>No mapping persisted</strong><p>This incident does not contain MITRE mapping evidence.</p></div>}
        </section>
      </div>

      <div className="detail-two-col">
        <section className="console-panel">
          <div className="panel-header"><div><span>PROCESS IMPACT</span><h2>What the system demonstrated</h2></div><ShieldAlert size={18}/></div>
          <div className="impact-callout">
            <strong>{String(impact.title ?? "Process impact")}</strong>
            <p>{impactText}</p>
            {processEvidence.register_address && <span>Evidence register R{String(processEvidence.register_address)} · value {valueText(processEvidence.value)}</span>}
          </div>
          <div className="factor-list">
            {Object.entries(risk).filter(([k]) => !["score","level","risk_id"].includes(k)).map(([k,v]) =>
              <div key={k}><span>{k.replaceAll("_"," ")}</span><strong>{typeof v === "object" ? JSON.stringify(v) : String(v)}</strong></div>
            )}
          </div>
        </section>

        <section className="console-panel copilot-preview">
          <Bot size={20}/><span>Evidence-grounded copilot</span>
          <h2>Explain what happened without inventing evidence.</h2>
          <p>Copilot can summarize the persisted control event, detections, process impact, MITRE mapping, risk factors, and response state. It cannot approve a response.</p>
          <Link href="/console/copilot" className="text-link">Open incident copilot <Target size={14}/></Link>
        </section>
      </div>

      <section className="console-panel graph-evidence-panel">
        <div className="panel-header"><div><span>EVIDENCE GRAPH</span><h2>Traceability from event to risk</h2></div><GitBranch size={18}/></div>
        {graphNodes.length ? (
          <div className="graph-evidence-grid">
            <div>
              {graphNodes.map((node, i) => {
                const n=obj(node);
                return <div className="graph-record" key={String(n.id ?? i)}>
                  <span>{String(n.type ?? "node").toUpperCase()}</span>
                  <strong>{String(n.label ?? n.id ?? "Evidence node")}</strong>
                </div>;
              })}
            </div>
            <div className="graph-relations">
              {graphEdges.map((edge, i) => {
                const e=obj(edge);
                return <div className="graph-relation" key={i}><span>{String(e.relation ?? "related")}</span><small>{String(e.source ?? "—")} → {String(e.target ?? "—")}</small></div>;
              })}
            </div>
          </div>
        ) : <div className="empty-state"><GitBranch size={24}/><strong>No evidence graph persisted</strong><p>The incident can still be investigated from its structured evidence fields.</p></div>}
      </section>
    </ConsoleShell>
  );
}
