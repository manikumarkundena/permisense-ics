"use client";

import { AlertTriangle, CheckCircle2, Gauge, Play, Radio, RefreshCw, ServerCog, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";

type DemoStatus = {
  status: string;
  plc: string;
  process?: {
    speed: number;
    current: number;
    load: number;
    position: number;
    workpieces: number;
    jam: number;
    state: number;
  };
  controls?: Record<string, number>;
  scenarios?: { speed?: string; mode?: string };
  error?: string;
};

type ScenarioResult = {
  scenario: string;
  description: string;
  result?: Record<string, unknown>;
};

function stateLabel(value?: number) {
  if (value == null) return "NO DATA";
  return ({ 0: "STOPPED", 1: "STARTING", 2: "RUNNING", 3: "DEGRADED", 4: "JAMMED", 5: "FAULT" } as Record<number, string>)[value] ?? "STATE " + value;
}

function number(value?: number, digits = 1) {
  return value == null ? "—" : value.toFixed(digits);
}

export default function DemoLabPage() {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState<"speed" | "mode" | "refresh" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const next = await api<DemoStatus>("/api/demo/status");
      setStatus(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo lab status unavailable");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(timer);
  }, [load]);

  async function runScenario(kind: "speed" | "mode") {
    setBusy(kind);
    setMessage("");
    setError("");
    try {
      const result = await api<ScenarioResult>("/api/demo/scenarios/" + kind, { method: "POST" });
      setMessage(result.description);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scenario request failed");
    } finally {
      setBusy(null);
    }
  }

  const process = status?.process;
  const controls = status?.controls;
  const ready = status?.status === "ready";

  return (
    <ConsoleShell>
      <div className="console-title-row">
        <div>
          <div className="section-label"><span /> PROTOCOL-REAL DEMO LAB</div>
          <h1>Operate the virtual industrial cell</h1>
          <p>These controls call the backend demo API, which performs real Modbus/TCP writes against the virtual PLC. No frontend-only security events are fabricated.</p>
        </div>
        <button className="button button-secondary" onClick={() => { setBusy("refresh"); void load().finally(() => setBusy(null)); }} disabled={busy !== null}>
          <RefreshCw size={14}/> {busy === "refresh" ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={15}/><div><strong>Backend response</strong><span>{error}</span></div></div>}
      {message && <div className="console-note"><CheckCircle2 size={16}/><div><strong>Scenario executed by backend.</strong><span>{message}</span></div></div>}

      <div className="lab-status-grid">
        <div className="console-stat"><span>LAB STATUS</span><strong>{status?.status?.toUpperCase() ?? "CONNECTING"}</strong><small>Backend readiness</small></div>
        <div className="console-stat"><span>PLC</span><strong>{status?.plc?.toUpperCase() ?? "—"}</strong><small>Modbus/TCP runtime</small></div>
        <div className="console-stat"><span>PROCESS</span><strong>{stateLabel(process?.state)}</strong><small>Manufacturing cell state</small></div>
        <div className="console-stat"><span>SPEED</span><strong>{number(process?.speed)} %</strong><small>Actual speed · R30001</small></div>
      </div>

      <div className="lab-grid">
        <section className="console-panel lab-process-panel">
          <div className="panel-header">
            <div><span>LIVE PROCESS STATE</span><h2>PLC-01 / conveyor cell</h2></div>
            <ServerCog size={18}/>
          </div>
          <div className="lab-process-flow">
            <div className="command-node"><ServerCog/><strong>PLC-01</strong><small>CONTROL</small></div>
            <div className="command-connection"><span>MODBUS / TCP</span><i/></div>
            <div className="command-node motor"><Gauge/><strong>MOTOR</strong><small>{number(process?.speed)} % SPEED</small></div>
            <div className="command-connection"><span>PROCESS</span><i/></div>
            <div className="command-node process"><Radio/><strong>CONVEYOR</strong><small>{stateLabel(process?.state)}</small></div>
          </div>
          <div className="lab-metrics">
            <div><span>ACTUAL SPEED</span><strong>{number(process?.speed)}%</strong><small>R30001</small></div>
            <div><span>MOTOR CURRENT</span><strong>{number(process?.current)} A</strong><small>R30002</small></div>
            <div><span>LOAD</span><strong>{number(process?.load)}%</strong><small>R30003</small></div>
            <div><span>WORKPIECES</span><strong>{number(process?.workpieces, 0)}</strong><small>R30005</small></div>
          </div>
        </section>

        <section className="console-panel">
          <div className="panel-header">
            <div><span>SCENARIO CONTROLS</span><h2>Real backend actions</h2></div>
            <ShieldAlert size={18}/>
          </div>
          <div className="lab-boundary">
            <ShieldAlert size={16}/>
            <div><strong>DEMO BOUNDARY</strong><span>Each button invokes a backend scenario that writes the virtual PLC. Detection and correlation happen through the same telemetry pipeline as any other event.</span></div>
          </div>

          <div className="scenario-card">
            <div><span>SCENARIO 01</span><strong>Unauthorized speed change</strong><p>Writes R40003 from the current safe setpoint to 90. The process runtime can then demonstrate overspeed evidence.</p></div>
            <button className="approve-button" onClick={() => void runScenario("speed")} disabled={!ready || busy !== null || status?.scenarios?.speed !== "ready"}>
              <Play size={14}/>{busy === "speed" ? "Executing…" : "Run speed scenario"}
            </button>
          </div>

          <div className="scenario-card">
            <div><span>SCENARIO 02</span><strong>Unauthorized operating-mode change</strong><p>Writes the operating mode to STOP when the current process conditions allow the scenario.</p></div>
            <button className="button button-secondary" onClick={() => void runScenario("mode")} disabled={!ready || busy !== null || status?.scenarios?.mode !== "ready"}>
              <Play size={14}/>{busy === "mode" ? "Executing…" : "Run mode scenario"}
            </button>
          </div>

          {!ready && <div className="empty-state"><AlertTriangle size={24}/><strong>Lab is not ready</strong><p>{status?.error ?? "Waiting for the backend PLC and process runtime."}</p></div>}
        </section>
      </div>

      <div className="console-note">
        <CheckCircle2 size={16}/>
        <div><strong>What this lab does not claim.</strong><span>The prototype has no physical PLC or plant. It reproduces industrial protocol traffic and process behavior in a hardware-independent virtual cell.</span></div>
      </div>
    </ConsoleShell>
  );
}
