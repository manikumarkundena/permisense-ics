import Link from "next/link";
import { Activity, Bot, CircleAlert, FlaskConical, LockKeyhole, Radio, ShieldCheck, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { href: "/console", label: "Overview", icon: Radio },
    { href: "/console/live", label: "Live telemetry", icon: Activity },
    { href: "/console/incidents", label: "Incidents", icon: CircleAlert },
    { href: "/console/response", label: "Response", icon: LockKeyhole },
    { href: "/console/copilot", label: "Evidence copilot", icon: Bot },
    { href: "/console/lab", label: "Demo lab", icon: FlaskConical },
  ];
  return (
    <main className="console-page">
      <header className="console-header">
        <div className="shell console-header-inner">
          <Link href="/" className="console-brand"><ShieldCheck size={17}/> PERMISENSE</Link>
          <div className="console-header-right">
            <span className="console-state"><span/> OPERATOR CONSOLE</span>
            <Link href="/" className="console-home">Public overview</Link>
          </div>
        </div>
      </header>

      <div className="shell console-layout">
        <aside className="console-sidebar">
          <div className="console-sidebar-title">OPERATIONS</div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/console" ? pathname === "/console" : pathname.startsWith(href);
            return <Link key={href} className={"console-nav" + (active ? " active" : "")} href={href} aria-current={active ? "page" : undefined}><Icon size={16}/> {label}</Link>;
          })}

          <div className="console-sidebar-title console-sidebar-lower">OPERATOR BOUNDARY</div>
          <div className="console-meta"><UsersRound size={13}/> Human approval required</div>
          <div className="console-meta">Evidence remains authoritative</div>
          <div className="console-meta">Recovery verified by telemetry</div>

          <div className="console-sidebar-title console-sidebar-lower">PIPELINE</div>
          <div className="console-meta">01 · Normalize</div>
          <div className="console-meta">02 · Detect</div>
          <div className="console-meta">03 · Correlate</div>
          <div className="console-meta">04 · Impact + risk</div>
          <div className="console-meta">05 · Respond + recover</div>
        </aside>
        <section className="console-main">{children}</section>
      </div>
    </main>
  );
}
