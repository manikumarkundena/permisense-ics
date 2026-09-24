import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

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

        <Link href="/console" className="nav-console">
          Open operator console <ArrowUpRight size={14} />
        </Link>
      </div>
    </header>
  );
}
