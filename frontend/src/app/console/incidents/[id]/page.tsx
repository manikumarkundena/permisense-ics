"use client";

import { AlertTriangle, ArrowLeft, Bot, GitBranch, LockKeyhole, ShieldAlert, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import type { Incident } from "@/types/industrial";

function obj(v: unknown): Record<string, unknown> { return v && typeof v === "object" ? v as Record<string, unknown> : {}; }

export default function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { params.then(({ id }) => api<Incident>(`/api/incidents/${id}`).then(setIncident).catch((e) => setError(e.message))); }, [params]);

  if (error) return <ConsoleShell><div className="error-banner"><AlertTriangle size={15}/>{error}</div><Link href="/console/incidents" className="text-link"><ArrowLeft size={14}/> Back to incidents</Link></ConsoleShell>;
  if (!incident) return <ConsoleShell><div className="empty-state large"><GitBranch size={28}/><strong>Loading incident evidence…</strong></div></ConsoleShell>;

  const risk=obj(incident.risk), impact=obj(incident.impact), evidence=obj(incident.evidence);
  const mappings=incident.mitre_mappings ?? [];
  return <ConsoleShell>
    <div className="breadcrumb"><Link href="/console/incidents"><ArrowLeft size={14}/> Incidents</Link><span>/</span>{incident.correlation_id.slice(0,8)}</div>
    <div className="incident-hero">
      <div><div className="section-label"><span /> CORRELATED INCIDENT</div><h1>{incident.title}</h1><p>{incident.reason}</p></div>
      <div className="risk-badge"><small>RISK</small><strong>{String(risk.level ?? incident.severity).toUpperCase()}</strong><span>{String(risk.score ?? "—")} / 100</span></div>
    </div>

    <div className="investigation-grid">
      <section className="console-panel evidence-detail">
        <div className="panel-header"><div><span>EVENT → IMPACT</span><h2>Evidence chain</h2></div><GitBranch size={18}/></div>
        <div className="evidence-flow">
          {[
            ["CONTROL EVENT", String(evidence.register_address ?? "40003"), `${evidence.previous_value ?? "50"} → ${evidence.value ?? "90"}`, "threat"],
            ["DETECTION", String(evidence.rule_id ?? "ICS-CONTROL-WRITE"), "HIGH", "amber"],
            ["PROCESS", "ACTUAL SPEED", String(impact.evidence ?? "90 > 80"), "system"],
            ["IMPACT", String(impact.impact_type ?? "PROCESS_DEGRADATION"), String(impact.description ?? "Operational process deviation"), "amber"],
            ["RISK", String(risk.level ?? "CRITICAL"), `${risk.score ?? "—"} / 100`, "threat"]
          ].map(([label,title,sub,tone], i) => <div className={`evidence-step tone-${tone}`} key={label}><span>{String(i+1).padStart(2,"0")}</span><small>{label}</small><strong>{title}</strong><em>{sub}</em>{i<4 && <div className="evidence-connector"/>}</div>)}
        </div>
      </section>

      <section className="console-panel">
        <div className="panel-header"><div><span>TECHNIQUE MAPPING</span><h2>MITRE ATT&CK for ICS</h2></div><Target size={18}/></div>
        <div className="mapping-list">{mappings.map((m,i)=><div className="mapping-row" key={i}><ShieldAlert size={15}/><div><strong>{String(m.technique_id ?? m.id ?? "Technique")}</strong><small>{String(m.name ?? m.technique ?? "")}</small></div></div>)}</div>
      </section>
    </div>

    <div className="detail-two-col">
      <section className="console-panel">
        <div className="panel-header"><div><span>DECISION FACTORS</span><h2>Why this risk exists</h2></div><ShieldAlert size={18}/></div>
        <div className="factor-list">{Object.entries(risk).filter(([k])=>k!=="score"&&k!=="level").map(([k,v])=><div key={k}><span>{k.replaceAll("_"," ")}</span><strong>{String(v)}</strong></div>)}</div>
      </section>
      <section className="console-panel copilot-preview">
        <Bot size={20}/><span>Evidence-grounded copilot</span><h2>Explain this incident with the supplied evidence.</h2><p>Ask the copilot from the response workspace after configuring the Gemini API key.</p><Link href="/console/response" className="text-link">Open response + copilot <ArrowLeft size={14}/></Link>
      </section>
    </div>
  </ConsoleShell>;
}
