import Link from "next/link";
import { ArrowUpRight, Menu, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-inner">
        <Link href="/" className="brand" aria-label="PermiSense home">
          <span className="brand-mark"><ShieldCheck size={17} strokeWidth={2.2} /></span>
          <span>PERMISENSE</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#system">System</a>
          <a href="#evidence">Evidence</a>
          <a href="#response">Response</a>
          <a href="#architecture">Architecture</a>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/console" className="nav-console">
            Live console <ArrowUpRight size={14} />
          </Link>
          <button className="icon-button mobile-menu" aria-label="Open navigation">
            <Menu size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
