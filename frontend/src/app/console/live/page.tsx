"use client";

import { Activity, ArrowLeft, Gauge, Radio, RotateCcw, ServerCog, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { LiveStatus } from "@/components/live-status";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { LiveEvent } from "@/types/industrial";

function valueOf(events: LiveEvent[], register: number) {
  return events.find((item) => item.register_address === register && item.value != null)?.value;
}

function processStateLabel(value: number | null | undefined) {
  if (value == null) return "NO DATA";
  const states: Record<number, string> = { 0: "STOPPED", 1: "STARTING", 2: "RUNNING", 3: "DEGRADED", 4: "JAMMED", 5: "FAULT" };
  return states[value] ?? "STATE " + value;
}

function displayValue(value: number | null | undefined, decimals = 1) {
  return value == null ? "—" : Number(value).toFixed(decimals);
}

const metrics: Array<{label:string; register:number; unit:string; icon:LucideIcon; decimals?:number}> = [
  { label:"SPEED", unit:"%", register:30001, icon:Gauge },
  { label:"CURRENT", unit:"A", register:30002, icon:Radio },
  { label:"LOAD", unit:"%", register:30003, icon:Activity },
  { label:"POSITION", unit:"°", register:30004, icon:RotateCcw },
  { label:"WORKPIECES", unit:"", register:30005, icon:ServerCog, decimals:0 },
];

export default function LivePage() {
  const { events, state } = useLiveEvents();
  const speed=valueOf(events,30001), process=valueOf(events,30007);
  const processLabel=processStateLabel(process), processIsHealthy=process===2;

  return (
    <ConsoleShell>
      <div className="console-title-row">
        <div>
          <div className="section-label"><span /> LIVE CELL / TELEMETRY</div>
          <h1>PLC-01 industrial process</h1>
          <p>Real process telemetry from the virtual PLC, normalized by the backend and streamed over WebSocket.</p>
        </div>
        <div className="console-actions">
          <LiveStatus state={state} />
          <Link href="/console" className="button button-secondary"><ArrowLeft size={14}/> Overview</Link>
        </div>
      </div>

      <div className="live-hero-grid">
        <section className="live-machine-card">
          <div className="machine-top">
            <span><ServerCog size={15}/> PLC-01 / MANUFACTURING-CELL-01</span>
            <span>MODBUS / TCP · 127.0.0.1:5020</span>
          </div>
          <div className="machine-diagram" aria-label="Industrial cell flow">
            <div className="machine-block"><ServerCog size={24}/><strong>PLC-01</strong><small>CONTROLLER</small></div>
            <div className="machine-wire">MODBUS</div>
            <div className="machine-block machine-motor"><Gauge size={24}/><strong>MOTOR</strong><small>{displayValue(speed)} % SPEED</small></div>
            <div className="machine-wire">PROCESS</div>
            <div className="machine-block machine-process">{processIsHealthy ? <Activity size={24}/> : <ShieldAlert size={24}/>}<strong>CONVEYOR</strong><small>{processLabel}</small></div>
          </div>
          <div className="command-foot">
            <span><span className="cell-live-dot" /> PROCESS STATE · {processLabel}</span>
            <Link href="/console/incidents">Review incidents →</Link>
          </div>
        </section>

        <section className="live-event-card">
          <div className="panel-header"><div><span>EVENT STREAM</span><h2>Latest normalized events</h2></div><Radio size={18}/></div>
          <div className="event-stream">
            {events.length===0 ? <div className="empty-state"><Activity size={28}/><strong>Waiting for telemetry</strong><p>Start the PLC and gateway. No frontend-generated events are inserted.</p></div> :
              events.slice(0,10).map(event=><div className="event-row" key={event.event_id} title={event.event_id}>
                <span className={"event-severity severity-"+(event.severity??"info").toLowerCase()}/>
                <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                <strong>{event.event_type.replaceAll("_"," ")}</strong>
                <span>{event.register_address ? "R"+event.register_address : event.asset_id ?? "SYSTEM"}</span>
                <b>{event.value ?? "—"}</b>
              </div>)}
          </div>
        </section>
      </div>

      <div className="telemetry-grid">
        {metrics.map(({label,register,unit,icon:Icon,decimals=1})=>{
          const value=valueOf(events,register);
          return <article className="metric-card" key={label}>
            <div><span>{label}</span><Icon size={15}/></div>
            <strong>{displayValue(value,decimals)}{unit && <small className="metric-unit">{unit}</small>}</strong>
            <span className="metric-register">INPUT REGISTER · R{register}</span>
          </article>;
        })}
      </div>
    </ConsoleShell>
  );
}
