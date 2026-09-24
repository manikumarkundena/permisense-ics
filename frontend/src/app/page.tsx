import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  LockKeyhole,
  Network,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waypoints,
  Zap
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { IndustrialCell } from "@/components/industrial-cell";

const chain = [
  ["EVENT", "A control write changes a PLC register.", "telemetry"],
  ["ASSET", "PermiSense identifies PLC-01 and its process.", "system"],
  ["BEHAVIOR", "The write is evaluated against deterministic rules.", "investigation"],
  ["THREAT", "The event maps to an ICS technique.", "threat"],
  ["PROCESS", "Process telemetry shows the resulting deviation.", "process"],
  ["IMPACT", "Cyber evidence becomes operational context.", "impact"],
  ["ACTION", "A controlled response is proposed for approval.", "recovery"]
] as const;

const capabilities = [
  {
    icon: Radar,
    eyebrow: "01 / OBSERVE",
    title: "Industrial telemetry with context",
    text: "Normalize protocol activity and process telemetry into one event model instead of leaving network events detached from the asset they affect."
  },
  {
    icon: GitBranch,
    eyebrow: "02 / CORRELATE",
    title: "From suspicious event to incident",
    text: "Deterministic detection connects control activity with subsequent process deviation so the incident has a traceable evidence chain."
  },
  {
    icon: ScanSearch,
    eyebrow: "03 / EXPLAIN",
    title: "Evidence before conclusions",
    text: "Show the register, values, thresholds, detections, process impact, MITRE mapping, and risk factors that support the incident."
  },
  {
    icon: LockKeyhole,
    eyebrow: "04 / RESPOND",
    title: "Human-approved containment",
    text: "The response engine validates an allowlisted action, records the approval, executes the controlled write, and verifies recovery."
  }
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label"><span />{children}</p>;
}

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> INDUSTRIAL INCIDENT INTELLIGENCE</div>
          <h1>
            Detect the threat.
            <br />
            <em>Trace the impact.</em>
            <br />
            Decide the response.
          </h1>
          <p className="hero-lede">
            PermiSense connects industrial communication, asset context, process
            behavior, and controlled response into one explainable security workflow.
          </p>

          <div className="hero-actions">
            <Link href="/console" className="button button-primary">
              Enter live console <ArrowRight size={16} />
            </Link>
            <a href="#system" className="button button-secondary">
              Explore the system <ArrowDownRight size={16} />
            </a>
          </div>

          <div className="hero-proof">
            <div><CheckCircle2 size={15} /> Protocol-real lab</div>
            <div><CheckCircle2 size={15} /> Deterministic detection</div>
            <div><CheckCircle2 size={15} /> Human approval gate</div>
          </div>
        </div>

        <div className="hero-visual">
          <IndustrialCell />
        </div>
      </section>

      <section className="signal-strip">
        <div className="shell signal-grid">
          <div><span className="signal-key">CELL</span><strong>MANUFACTURING-CELL-01</strong></div>
          <div><span className="signal-key">ASSET</span><strong>PLC-01 / MODBUS TCP</strong></div>
          <div><span className="signal-key">PROCESS</span><strong>CONVEYOR / MOTOR DRIVE</strong></div>
          <div><span className="signal-key">STATE</span><strong className="state-ok"><span /> TELEMETRY READY</strong></div>
        </div>
      </section>

      <section id="system" className="section shell">
        <div className="section-heading">
          <div>
            <SectionLabel>The problem</SectionLabel>
            <h2>Industrial security needs more than a traffic verdict.</h2>
          </div>
          <p>
            A suspicious write is only the beginning. The security question is what
            asset changed, what process moved, what evidence supports the change,
            and what response is safe to take next.
          </p>
        </div>

        <div className="problem-grid">
          <div className="problem-card problem-card-main">
            <span className="card-index">01</span>
            <CircleAlert size={22} />
            <h3>Network event</h3>
            <p>40003 changes from <strong>50.0 → 90.0</strong>.</p>
            <div className="mini-event"><span>CONTROL_WRITE</span><span>PLC-01</span></div>
          </div>
          <div className="problem-arrow"><ArrowRight /></div>
          <div className="problem-card">
            <span className="card-index">02</span>
            <Activity size={22} />
            <h3>Process deviation</h3>
            <p>Actual speed reaches <strong>90.0</strong>, crossing the <strong>80.0</strong> threshold.</p>
            <div className="mini-meter"><span /></div>
          </div>
          <div className="problem-arrow"><ArrowRight /></div>
          <div className="problem-card">
            <span className="card-index">03</span>
            <Waypoints size={22} />
            <h3>Operational context</h3>
            <p>Control + process evidence become one incident with explainable risk and response.</p>
            <div className="mini-tags"><span>THREAT</span><span>IMPACT</span><span>ACTION</span></div>
          </div>
        </div>
      </section>

      <section className="chain-section">
        <div className="shell">
          <div className="section-heading chain-heading">
            <div>
              <SectionLabel>Signature workflow</SectionLabel>
              <h2>EVENT <span>→</span> IMPACT</h2>
            </div>
            <p>
              The core PermiSense model keeps the investigation connected from the
              first industrial event through the response decision.
            </p>
          </div>

          <div className="chain">
            {chain.map(([label, text, tone], index) => (
              <div className={`chain-item tone-${tone}`} key={label}>
                <div className="chain-node">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div className="chain-line" />
                </div>
                <div>
                  <span className="chain-label">{label}</span>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <SectionLabel>How PermiSense works</SectionLabel>
            <h2>Security decisions stay grounded in system evidence.</h2>
          </div>
        </div>

        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, eyebrow, title, text }) => (
            <article className="capability-card" key={eyebrow}>
              <div className="capability-icon"><Icon size={20} /></div>
              <span>{eyebrow}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowRight className="capability-arrow" size={17} />
            </article>
          ))}
        </div>
      </section>

      <section id="evidence" className="section shell">
        <div className="evidence-panel">
          <div className="evidence-copy">
            <SectionLabel>Evidence graph</SectionLabel>
            <h2>Make the reasoning visible.</h2>
            <p>
              Instead of a single alert score, the investigation surface exposes
              how the incident was formed: control event, detections, ATT&CK
              techniques, process deviation, impact, and risk.
            </p>
            <div className="evidence-facts">
              <div><span>REGISTER</span><strong>40003</strong></div>
              <div><span>CHANGE</span><strong>50.0 → 90.0</strong></div>
              <div><span>ACTUAL SPEED</span><strong>90.0</strong></div>
              <div><span>THRESHOLD</span><strong>80.0</strong></div>
            </div>
          </div>

          <div className="evidence-graph" aria-label="Evidence relationship preview">
            <div className="graph-node graph-control"><small>CONTROL EVENT</small><strong>40003</strong><span>50 → 90</span></div>
            <div className="graph-node graph-detection"><small>DETECTION</small><strong>ICS-CONTROL-WRITE</strong><span>HIGH</span></div>
            <div className="graph-node graph-process"><small>PROCESS</small><strong>ACTUAL SPEED</strong><span>90 &gt; 80</span></div>
            <div className="graph-node graph-impact"><small>IMPACT</small><strong>PROCESS DEGRADATION</strong><span>CONVEYOR</span></div>
            <div className="graph-node graph-risk"><small>RISK</small><strong>CRITICAL</strong><span>100 / 100</span></div>
            <div className="graph-wire wire-a" />
            <div className="graph-wire wire-b" />
            <div className="graph-wire wire-c" />
            <div className="graph-wire wire-d" />
          </div>
        </div>
      </section>

      <section id="response" className="section shell">
        <div className="response-panel">
          <div>
            <SectionLabel>Controlled response</SectionLabel>
            <h2>Containment with a human in the loop.</h2>
            <p>
              PermiSense does not turn an AI suggestion into an automatic plant
              action. The response layer validates the action, asks for explicit
              operator approval, records the execution, and verifies recovery.
            </p>
            <Link href="/console/response" className="text-link">Open response workspace <ArrowRight size={15} /></Link>
          </div>
          <div className="response-flow">
            <div className="response-step done"><span>01</span><ShieldCheck /><strong>Evidence</strong><small>Incident grounded</small></div>
            <ArrowRight className="response-arrow" />
            <div className="response-step active"><span>02</span><LockKeyhole /><strong>Approve</strong><small>Operator confirmation</small></div>
            <ArrowRight className="response-arrow" />
            <div className="response-step"><span>03</span><Zap /><strong>Execute</strong><small>Allowlisted action</small></div>
            <ArrowRight className="response-arrow" />
            <div className="response-step"><span>04</span><CheckCircle2 /><strong>Recover</strong><small>Verify telemetry</small></div>
          </div>
        </div>
      </section>

      <section id="architecture" className="architecture-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <SectionLabel>Architecture</SectionLabel>
              <h2>Built around the industrial event lifecycle.</h2>
            </div>
          </div>
          <div className="architecture-map">
            {[
              ["01", "Industrial cell", "PLC + process + sensors"],
              ["02", "Telemetry", "Canonical event stream"],
              ["03", "Detection", "Deterministic rules"],
              ["04", "Correlation", "Cyber + process evidence"],
              ["05", "Risk", "Operational impact"],
              ["06", "Response", "Approval + recovery"]
            ].map(([n, title, desc]) => (
              <div className="arch-node" key={n}>
                <span>{n}</span>
                <Network size={17} />
                <strong>{title}</strong>
                <small>{desc}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta shell">
        <div className="cta-mark"><Sparkles size={19} /></div>
        <SectionLabel>PermiSense</SectionLabel>
        <h2>See the incident, not just the alert.</h2>
        <p>Enter the console and follow a real protocol-level attack through detection, impact analysis, response, and recovery.</p>
        <Link href="/console" className="button button-primary">Open PermiSense console <ArrowRight size={16} /></Link>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="brand"><span className="brand-mark"><ShieldCheck size={17} /></span><span>PERMISENSE</span></div>
          <span>Cyber-physical incident intelligence</span>
          <span>Protocol-real virtual industrial lab</span>
        </div>
      </footer>
    </main>
  );
}
