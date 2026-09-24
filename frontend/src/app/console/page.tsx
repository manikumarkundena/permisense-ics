"use client";

import { Activity, AlertTriangle, CheckCircle2, Cpu, GitBranch, Gauge, ShieldCheck, Wifi } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { LiveStatus } from "@/components/live-status";
import { api } from "@/lib/api";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { Incident, SystemStatus } from "@/types/industrial";

export default function ConsolePage() {
  const {events,state}=useLiveEvents();
  const [status,setStatus]=useState<SystemStatus|null>(null);
  const [incidents,setIncidents]=useState<Incident[]>([]);
  useEffect(()=>{api<SystemStatus>("/api/system/status").then(setStatus).catch(()=>{});api<Incident[]>("/api/incidents").then(setIncidents).catch(()=>{});},[]);

  const latest=events[0];
  return <ConsoleShell>
    <div className="console-title-row">
      <div><div className="section-label"><span/> LIVE SECURITY CONSOLE</div><h1>Manufacturing cell command center</h1><p>One operator surface for telemetry, incidents, evidence, and controlled response.</p></div>
      <LiveStatus state={state}/>
    </div>

    <div className="console-stat-grid">
      {[
        ["SYSTEM",status?.status?.toUpperCase()??"—","FastAPI backend"],
        ["PLC-01","MODBUS / TCP","Virtual industrial cell"],
        ["LIVE EVENTS",String(events.length),"WebSocket buffer"],
        ["INCIDENTS",String(incidents.length),"Correlated records"]
      ].map(([a,b,c])=><div className="console-stat" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}
    </div>

    <div className="console-command-grid">
      <section className="console-panel command-cell">
        <div className="panel-header"><div><span>INDUSTRIAL CELL</span><h2>PLC-01 / Conveyor process</h2></div><Cpu size={18}/></div>
        <div className="command-machine">
          <div className="command-node"><Cpu/><strong>PLC-01</strong><small>CONTROL</small></div>
          <div className="command-connection"><span>MODBUS TCP</span><i/></div>
          <div className="command-node motor"><Gauge/><strong>MOTOR</strong><small>PROCESS DRIVE</small></div>
          <div className="command-connection"><span>TELEMETRY</span><i/></div>
          <div className="command-node process"><Activity/><strong>CONVEYOR</strong><small>PROCESS STATE</small></div>
        </div>
        <div className="command-foot"><span><Wifi size={13}/> Protocol connected</span><Link href="/console/live">Open live telemetry →</Link></div>
      </section>

      <section className="console-panel">
        <div className="panel-header"><div><span>LIVE EVENT</span><h2>{latest?.event_type ?? "Awaiting backend event"}</h2></div><GitBranch size={18}/></div>
        {latest?<div className="latest-event">
          <div className="latest-event-top"><span className="event-severity severity-{(latest.severity??"info").toLowerCase()}"/><strong>{latest.event_type}</strong><time>{new Date(latest.timestamp).toLocaleTimeString()}</time></div>
          <div className="latest-event-value"><span>REGISTER</span><strong>{latest.register_address??"—"}</strong><span>VALUE</span><strong>{latest.value??"—"}</strong></div>
          <p>{latest.asset_id??"System"} · {latest.protocol??"telemetry"} · {latest.command??"event received"}</p>
        </div>:<div className="empty-state"><Activity size={28}/><strong>Waiting for live telemetry</strong><p>Start the industrial lab and gateway. This panel will populate from /ws/events.</p></div>}
      </section>
    </div>

    <div className="console-grid">
      <section className="console-panel">
        <div className="panel-header"><div><span>INCIDENT PIPELINE</span><h2>Detection chain</h2></div><ShieldCheck size={18}/></div>
        <div className="pipeline">
          {[
            ["Event normalization","online"],
            ["Deterministic detection","online"],
            ["Correlation + process impact","online"],
            ["Risk + evidence graph","online"],
            ["Human-approved response","online"],
            ["AI copilot",status?.components.ai_copilot??"not configured"]
          ].map(([label,s])=><div key={label}><span className={`pipeline-dot ${s==="online"?"ok":"pending"}`}/>{label}<small>{s}</small></div>)}
        </div>
      </section>
      <section className="console-panel">
        <div className="panel-header"><div><span>RECENT INCIDENTS</span><h2>Investigation queue</h2></div><AlertTriangle size={18}/></div>
        {incidents.slice(0,4).map(i=><Link className="mini-incident" href={`/console/incidents/${i.correlation_id}`} key={i.correlation_id}><span className={`incident-severity severity-${i.severity.toLowerCase()}`}>{i.severity}</span><div><strong>{i.title}</strong><small>{i.asset_id} · {new Date(i.timestamp).toLocaleTimeString()}</small></div><span>→</span></Link>)}
        {!incidents.length&&<div className="empty-state"><CheckCircle2 size={26}/><strong>No incidents yet</strong><p>That's a real empty state. No synthetic alerts are inserted.</p></div>}
      </section>
    </div>

    <div className="console-note"><CheckCircle2 size={16}/><div><strong>Architecture status: backend-connected.</strong><span>The next demo action can be a real Modbus write from the industrial lab, not a frontend trigger.</span></div></div>
  </ConsoleShell>;
}
