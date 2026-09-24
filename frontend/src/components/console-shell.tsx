import Link from "next/link";
import { Activity, Bot, CircleAlert, FlaskConical, LockKeyhole, Radio, ShieldCheck, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/console", label: "Command center", icon: Radio },
  { href: "/console/live", label: "Live process", icon: Activity },
  { href: "/console/incidents", label: "Incidents", icon: CircleAlert },
  { href: "/console/response", label: "Response", icon: LockKeyhole },
  { href: "/console/copilot", label: "Evidence copilot", icon: Bot },
  { href: "/console/lab", label: "Demo lab", icon: FlaskConical },
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="console-page">
      <header className="console-header">
        <div className="console-header-inner shell">
          <Link href="/" className="console-brand"><span className="console-brand-mark"><ShieldCheck size={17}/></span><span>PERMISENSE</span></Link>
          <div className="console-topline">
            <span className="status-chip"><i/> INDUSTRIAL CELL ONLINE</span>
            <span className="topline-divider"/>
            <span>OPERATOR MODE</span>
            <Link href="/" className="console-home">Exit console</Link>
          </div>
        </div>
      </header>

      <div className="console-frame shell">
        <aside className="console-sidebar">
          <div className="sidebar-kicker">COMMAND SURFACE</div>
          <nav className="console-nav-stack">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/console" ? pathname === "/console" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={"console-nav " + (active ? "active" : "")} aria-current={active ? "page" : undefined}>
                  <span className="nav-icon"><Icon size={16}/></span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-section">
            <div className="sidebar-kicker">OPERATING PRINCIPLES</div>
            <div className="sidebar-rule"><UsersRound size={13}/><span>Human approval required</span></div>
            <div className="sidebar-rule"><ShieldCheck size={13}/><span>Evidence is authoritative</span></div>
            <div className="sidebar-rule"><Activity size={13}/><span>Recovery is telemetry-verified</span></div>
          </div>

          <div className="sidebar-section sidebar-pipeline">
            <div className="sidebar-kicker">INTELLIGENCE PIPELINE</div>
            {["Observe", "Detect", "Correlate", "Impact", "Decide", "Recover"].map((item, index) => (
              <div className="pipeline-mini" key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></div>
            ))}
          </div>
        </aside>

        <section className="console-main">
          <div className="console-main-inner">{children}</div>
        </section>
      </div>
    </main>
  );
}
