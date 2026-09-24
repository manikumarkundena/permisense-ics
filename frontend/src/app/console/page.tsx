import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Cpu,
  Gauge,
  GitBranch,
  LockKeyhole,
  Radio,
  ShieldCheck
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Live Console"
};

const cards = [
  ["ASSET", "PLC-01", "Modbus/TCP"],
  ["PROCESS", "Manufacturing cell", "Conveyor / motor"],
  ["DETECTION", "Deterministic", "Backend rules"],
  ["RESPONSE", "Human approved", "Allowlisted actions"]
];

export default function ConsolePage() {
  return (
    <main className="console-page">
      <header className="console-header">
        <div className="shell console-header-inner">
          <Link href="/" className="console-brand"><ShieldCheck size={17} /> PERMISENSE</Link>
          <div className="console-header-right">
            <span className="console-state"><span /> SYSTEM READY</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="shell console-layout">
        <aside className="console-sidebar">
          <div className="console-sidebar-title">OPERATIONS</div>
          <Link className="console-nav active" href="/console"><Radio size={16} /> Live overview</Link>
          <Link className="console-nav" href="/console/incidents"><CircleAlert size={16} /> Incidents</Link>
          <Link className="console-nav" href="/console/live"><Activity size={16} /> Live telemetry</Link>
          <Link className="console-nav" href="/console/response"><LockKeyhole size={16} /> Response</Link>
          <div className="console-sidebar-title console-sidebar-lower">SYSTEM</div>
          <div className="console-meta"><Cpu size={14} /> API / backend link</div>
          <div className="console-meta"><GitBranch size={14} /> Evidence pipeline</div>
        </aside>

        <section className="console-main">
          <div className="console-title-row">
            <div>
              <div className="section-label"><span /> LIVE SECURITY CONSOLE</div>
              <h1>Manufacturing cell overview</h1>
              <p>Real backend telemetry will populate this surface next. No synthetic live events are presented here.</p>
            </div>
            <Link href="/" className="button button-secondary"><ArrowLeft size={15} /> Landing</Link>
          </div>

          <div className="console-stat-grid">
            {cards.map(([label, value, sub]) => (
              <div className="console-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>

          <div className="console-grid">
            <section className="console-panel telemetry-panel">
              <div className="panel-header"><div><span>PROCESS TELEMETRY</span><h2>PLC-01 / Conveyor</h2></div><Gauge size={18} /></div>
              <div className="telemetry-empty">
                <Activity size={30} />
                <strong>Awaiting live WebSocket stream</strong>
                <p>The UI is intentionally showing an empty state until the real backend connection is wired.</p>
              </div>
            </section>

            <section className="console-panel">
              <div className="panel-header"><div><span>INCIDENT PIPELINE</span><h2>Detection chain</h2></div><GitBranch size={18} /></div>
              <div className="pipeline">
                <div><span className="pipeline-dot ok" /> Event normalization <small>ready</small></div>
                <div><span className="pipeline-dot ok" /> Deterministic detection <small>ready</small></div>
                <div><span className="pipeline-dot ok" /> Correlation + impact <small>ready</small></div>
                <div><span className="pipeline-dot ok" /> Risk + evidence <small>ready</small></div>
                <div><span className="pipeline-dot pending" /> Copilot <small>API key required</small></div>
              </div>
            </section>
          </div>

          <div className="console-note">
            <CheckCircle2 size={16} />
            <div><strong>Backend foundation verified.</strong><span>The next frontend layer connects these surfaces to the existing FastAPI APIs and WebSocket event broadcaster.</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
