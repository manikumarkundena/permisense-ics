"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, Gauge, Play, Radio, RefreshCw, ServerCog, ShieldAlert, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";

type DemoStatus = {
  status: string;
  plc: string;
  process?: { speed:number; current:number; load:number; position:number; workpieces:number; jam:number; state:number };
  controls?: Record<string,number>;
  scenarios?: { speed?:string; mode?:string };
  error?: string;
};
type ScenarioResult = { scenario:string; description:string; result?:Record<string,unknown> };
type Incident = { incident_id:string; severity:string; title:string; status?:string; timestamp:string; control?:{register_address?:number;previous_value?:number;value?:number}; reason?:string };

function stateLabel(value?: number) {
  if (value == null) return "NO DATA";
  return ({0:"STOPPED",1:"STARTING",2:"RUNNING",3:"DEGRADED",4:"JAMMED",5:"FAULT"} as Record<number,string>)[value] ?? "STATE "+value;
}
function num(value?:number,d=1){ return value==null ? "—" : value.toFixed(d); }

export default function DemoLabPage(){
  const [status,setStatus]=useState<DemoStatus|null>(null);
  const [incidents,setIncidents]=useState<Incident[]>([]);
  const [busy,setBusy]=useState<"speed"|"mode"|"refresh"|null>(null);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    try{
      const [next, incidentData] = await Promise.all([
        api<DemoStatus>("/api/demo/status"),
        api<{count:number;incidents:Incident[]}>("/api/incidents"),
      ]);
      setStatus(next);
      setIncidents(incidentData.incidents);
      setError("");
    }catch(e){setError(e instanceof Error?e.message:"Demo lab backend unavailable");}
  },[]);

  useEffect(()=>{void load();const t=window.setInterval(()=>void load(),2000);return()=>window.clearInterval(t)},[load]);

  async function runScenario(kind:"speed"|"mode"){
    setBusy(kind);setMessage("");setError("");
    try{
      const result=await api<ScenarioResult>("/api/demo/scenarios/"+kind,{method:"POST"});
      setMessage(result.description);
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Scenario request failed");}
    finally{setBusy(null)}
  }

  const process=status?.process;
  const latest=incidents[0];
  const ready=status?.status==="ready";
  const scenarioActive=Boolean(latest && (latest.status==="open" || latest.status==="investigating"));
  const recovered=latest?.status==="recovered";

  return <ConsoleShell>
    <div className="console-title-row">
      <div>
        <div className="section-label"><span/> PROTOCOL-REAL DEMO LAB</div>
        <h1>Run the cyber-physical story live.</h1>
        <p>This is the presentation control room: trigger a real Modbus/TCP change, watch the same backend detect and correlate it, then move into the evidence and human-approved response workspaces.</p>
      </div>
      <button className="button button-secondary" onClick={()=>{setBusy("refresh");void load().finally(()=>setBusy(null))}} disabled={busy!==null}><RefreshCw size={14}/>{busy==="refresh"?"Refreshing…":"Refresh"}</button>
    </div>

    {error && <div className="error-banner"><AlertTriangle size={15}/><div><strong>Backend response</strong><span>{error}</span></div></div>}
    {message && <div className="console-note"><CheckCircle2 size={16}/><div><strong>Backend scenario executed.</strong><span>{message}</span></div></div>}

    <div className="console-stat-grid">
      <div className="console-stat"><span>LAB</span><strong>{status?.status?.toUpperCase()??"CONNECTING"}</strong><small>Backend readiness</small></div>
      <div className="console-stat"><span>PLC-01</span><strong>{status?.plc?.toUpperCase()??"—"}</strong><small>Real Modbus/TCP runtime</small></div>
      <div className="console-stat"><span>PROCESS</span><strong>{stateLabel(process?.state)}</strong><small>Current process state</small></div>
      <div className="console-stat"><span>INCIDENT</span><strong>{latest?.severity??"NONE"}</strong><small>{latest?"Correlated backend record":"Waiting for event"}</small></div>
    </div>

    <section className="demo-journey">
      {[
        ["01","TRIGGER","Real Modbus write",busy==="speed"||busy==="mode"],
        ["02","OBSERVE","Gateway + telemetry",Boolean(latest)],
        ["03","CORRELATE","Detection + impact",Boolean(latest)],
        ["04","DECIDE","Human response gate",scenarioActive],
        ["05","RECOVER","Readback + verify",recovered],
      ].map(([n,title,desc,on],i)=><div className={"demo-journey-step "+(on?"on":"")} key={n}><span>{n}</span><strong>{title}</strong><small>{desc}</small>{i<4&&<ArrowRight size={13}/>}</div>)}
    </section>

    <div className="lab-grid">
      <section className="console-panel lab-process-panel">
        <div className="panel-header"><div><span>LIVE PROCESS STATE</span><h2>Virtual manufacturing cell</h2></div><ServerCog size={18}/></div>
        <div className="lab-process-flow">
          <div className="command-node"><ServerCog/><strong>PLC-01</strong><small>CONTROL</small></div>
          <div className="command-connection"><span>MODBUS / TCP</span><i/></div>
          <div className="command-node motor"><Gauge/><strong>MOTOR</strong><small>{num(process?.speed)} SPEED</small></div>
          <div className="command-connection"><span>PROCESS</span><i/></div>
          <div className="command-node process"><Radio/><strong>CONVEYOR</strong><small>{stateLabel(process?.state)}</small></div>
        </div>
        <div className="lab-metrics">
          <div><span>ACTUAL SPEED</span><strong>{num(process?.speed)}</strong><small>R30001</small></div>
          <div><span>MOTOR CURRENT</span><strong>{num(process?.current)} A</strong><small>R30002</small></div>
          <div><span>LOAD</span><strong>{num(process?.load)}%</strong><small>R30003</small></div>
          <div><span>WORKPIECES</span><strong>{num(process?.workpieces,0)}</strong><small>R30005</small></div>
        </div>
        <div className="command-foot"><span><span className="cell-live-dot"/> Backend process telemetry</span><Link href="/console/live">Open live process →</Link></div>
      </section>

      <section className="console-panel">
        <div className="panel-header"><div><span>SCENARIO CONTROLS</span><h2>Trigger the real backend</h2></div><ShieldAlert size={18}/></div>
        <div className="lab-boundary"><ShieldAlert size={16}/><div><strong>NO FRONTEND-ONLY ALERTS</strong><span>Buttons call backend scenario endpoints. The backend performs the Modbus write; gateway observation, process telemetry, detection, correlation and incident persistence then run normally.</span></div></div>

        <div className="scenario-card"><div><span>SCENARIO 01</span><strong>Unauthorized speed setpoint</strong><p>Writes R40003 from the safe setpoint to 90. The process runtime produces overspeed evidence when the new setpoint takes effect.</p></div><button className="approve-button" onClick={()=>void runScenario("speed")} disabled={!ready||busy!==null||status?.scenarios?.speed!=="ready"}><Play size={14}/>{busy==="speed"?"Executing…":"Trigger attack"}</button></div>
        <div className="scenario-card"><div><span>SCENARIO 02</span><strong>Unauthorized operating mode</strong><p>Writes R40002 to STOP when the cell is in a safe baseline, producing a control-change event through the same observation pipeline.</p></div><button className="button button-secondary" onClick={()=>void runScenario("mode")} disabled={!ready||busy!==null||status?.scenarios?.mode!=="ready"}><Play size={14}/>{busy==="mode"?"Executing…":"Trigger mode change"}</button></div>

        {latest && <div className="lab-incident-card"><div><span>LATEST CORRELATED INCIDENT</span><strong>{latest.severity} · {latest.status??"open"}</strong><small>{latest.title}</small></div><div className="lab-incident-actions"><Link href={"/console/incidents/"+latest.incident_id} className="button button-secondary">Inspect evidence <ArrowRight size={13}/></Link><Link href="/console/response" className="button button-secondary">Open response <LockIcon/></Link></div></div>}
        {!ready && <div className="empty-state"><AlertTriangle size={24}/><strong>Lab is not ready</strong><p>{status?.error??"Waiting for the backend PLC and process runtime."}</p></div>}
      </section>
    </div>

    <div className="demo-next-grid">
      <Link href="/console/incidents" className="demo-next"><CircleAlert size={17}/><div><span>AFTER TRIGGER</span><strong>Investigate the correlated incident</strong><small>See control event → process deviation → impact → risk → ATT&CK evidence.</small></div><ArrowRight size={15}/></Link>
      <Link href="/console/response" className="demo-next"><ShieldCheck size={17}/><div><span>THEN</span><strong>Approve and verify recovery</strong><small>The response remains behind a human approval gate and is verified by telemetry.</small></div><ArrowRight size={15}/></Link>
      <Link href="/console/copilot" className="demo-next"><ShieldCheck size={17}/><div><span>OPTIONAL AI LAYER</span><strong>Ask the evidence copilot</strong><small>Grounded interpretation only; it cannot authorize or execute the response.</small></div><ArrowRight size={15}/></Link>
    </div>

    <div className="console-note"><CheckCircle2 size={16}/><div><strong>Prototype boundary.</strong><span>The industrial cell is virtual and hardware-independent. The Modbus/TCP communication, backend detection/correlation path and allowlisted response writes are real within that virtual environment.</span></div></div>
  </ConsoleShell>;
}

function LockIcon(){ return <span style={{display:"inline-flex",alignItems:"center"}}>↗</span> }
