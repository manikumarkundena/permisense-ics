import Link from "next/link";
import { Activity, Bot, CircleAlert, LockKeyhole, Radio, ShieldCheck, UsersRound } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return <main className="console-page">
    <header className="console-header">
      <div className="shell console-header-inner">
        <Link href="/" className="console-brand"><ShieldCheck size={17}/> PERMISENSE</Link>
        <div className="console-header-right">
          <span className="console-state"><span/> OPERATOR CONSOLE</span>
          <ThemeToggle/>
        </div>
      </div>
    </header>
    <div className="shell console-layout">
      <aside className="console-sidebar">
        <div className="console-sidebar-title">OPERATIONS</div>
        <Link className="console-nav" href="/console"><Radio size={16}/> Overview</Link>
        <Link className="console-nav" href="/console/live"><Activity size={16}/> Live telemetry</Link>
        <Link className="console-nav" href="/console/incidents"><CircleAlert size={16}/> Incidents</Link>
        <Link className="console-nav" href="/console/response"><LockKeyhole size={16}/> Response</Link>
        <Link className="console-nav" href="/console/copilot"><Bot size={16}/> Copilot</Link>

        <div className="console-sidebar-title console-sidebar-lower">HUMAN + SYSTEM</div>
        <div className="console-meta"><UsersRound size={13}/> Operator approval gate</div>
        <div className="console-meta">Evidence-grounded decisions</div>
        <div className="console-meta">Recovery verified from telemetry</div>

        <div className="console-sidebar-title console-sidebar-lower">PIPELINE</div>
        <div className="console-meta">01 · Normalize</div>
        <div className="console-meta">02 · Detect</div>
        <div className="console-meta">03 · Correlate</div>
        <div className="console-meta">04 · Impact + risk</div>
        <div className="console-meta">05 · Respond + recover</div>
      </aside>
      <section className="console-main">{children}</section>
    </div>
  </main>;
}
