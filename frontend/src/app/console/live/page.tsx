"use client";

import { Activity, ArrowLeft, Gauge, Radio, RotateCcw, ServerCog } from "lucide-react";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { LiveStatus } from "@/components/live-status";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { LiveEvent } from "@/types/industrial";

function valueOf(events: LiveEvent[], register: number) {
  const event = events.find((item) => item.register_address === register && item.value != null);
  return event?.value;
}

export default function LivePage() {
  const { events, state } = useLiveEvents();
  const speed = valueOf(events, 30001);
  const load = valueOf(events, 30003);
  const current = valueOf(events, 30002);
  const position = valueOf(events, 30004);
  const workpieces = valueOf(events, 30005);
  const process = valueOf(events, 30007);

  return <ConsoleShell>
    <div className="console-title-row">
      <div><div className="section-label"><span /> LIVE CELL</div><h1>PLC-01 telemetry</h1><p>Values below are populated only from the backend WebSocket stream.</p></div>
      <div className="console-actions"><LiveStatus state={state} /><Link href="/console" className="button button-secondary"><ArrowLeft size={14}/> Overview</Link></div>
    </div>

    <div className="live-hero-grid">
      <div className="live-machine-card">
        <div className="machine-top"><span><ServerCog size={15}/> PLC-01</span><span>MODBUS / TCP</span></div>
        <div className="machine-diagram">
          <div className="machine-block"><strong>PLC-01</strong><small>RUNNING</small></div>
          <div className="machine-wire">MODBUS</div>
          <div className="machine-block machine-motor"><strong>MOTOR</strong><small>{speed == null ? "—" : `${speed.toFixed(1)} RPM`}</small></div>
          <div className="machine-wire">PROCESS</div>
          <div className="machine-block machine-process"><strong>CONVEYOR</strong><small>{process === 2 ? "RUNNING" : process == null ? "—" : `STATE ${process}`}</small></div>
        </div>
      </div>
      <div className="live-event-card">
        <div className="panel-header"><div><span>EVENT STREAM</span><h2>Latest backend events</h2></div><Radio size={18}/></div>
        <div className="event-stream">
          {events.length === 0 ? <div className="empty-state"><Activity size={28}/><strong>Waiting for telemetry</strong><p>Start the PLC and gateway to see real events here.</p></div> :
          events.slice(0, 8).map((event) => <div className="event-row" key={event.event_id}>
            <span className={`event-severity severity-${(event.severity ?? "info").toLowerCase()}`} />
            <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
            <strong>{event.event_type}</strong>
            <span>{event.register_address ? `R${event.register_address}` : event.asset_id ?? "system"}</span>
            <b>{event.value ?? "—"}</b>
          </div>)}
        </div>
      </div>
    </div>

    <div className="telemetry-grid">
      {[
        ["SPEED", speed, "RPM", 30001, Gauge],
        ["LOAD", load, "%", 30003, Activity],
        ["CURRENT", current, "A", 30002, Radio],
        ["POSITION", position, "°", 30004, RotateCcw],
        ["WORKPIECES", workpieces, "", 30005, ServerCog]
      ].map(([label, value, unit, register, Icon]) => <div className="metric-card" key={label as string}>
        <div><span>{label as string}</span><Icon size={15}/></div>
        <strong>{value == null ? "—" : Number(value).toFixed(label === "WORKPIECES" ? 0 : 1)}</strong>
        <small>{unit as string} · INPUT REGISTER {register as number}</small>
      </div>)}
    </div>
  </ConsoleShell>;
}
