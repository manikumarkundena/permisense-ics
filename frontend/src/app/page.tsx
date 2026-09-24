import Link from "next/link";
import {
  Activity, ArrowRight, CheckCircle2, CircleAlert, GitBranch, LockKeyhole,
  Network, Radar, ScanSearch, ShieldCheck, Waypoints, Zap
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const chain = [
  ["EVENT", "A control write changes a PLC register."],
  ["DETECT", "Deterministic rules identify suspicious industrial behavior."],
  ["CORRELATE", "Cyber and process evidence are linked to the same asset."],
  ["IMPACT", "Telemetry shows what changed in the operational process."],
  ["RISK", "Operational consequences become explainable risk."],
  ["RESPOND", "An allowlisted action is prepared for an operator."],
  ["RECOVER", "Readback and process telemetry verify the result."]
] as const;

const capabilities = [
  { icon: Radar, eyebrow: "01 / OBSERVE", title: "Protocol-real industrial telemetry", text: "Modbus/TCP and process telemetry enter one canonical event model with asset and register context." },
  { icon: GitBranch, eyebrow: "02 / CORRELATE", title: "Cyber event → process impact", text: "Deterministic correlation connects a control change to the process behavior that follows it." },
  { icon: ScanSearch, eyebrow: "03 / EXPLAIN", title: "Evidence before conclusions", text: "Register values, thresholds, detections, ATT&CK mappings, impact and risk remain visible to the operator." },
  { icon: LockKeyhole, eyebrow: "04 / RESPOND", title: "Human-approved recovery", text: "Allowlisted response playbooks require approval, perform real writes, read them back and verify telemetry." }
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label"><span />{children}</p>;
}

function SignalMonitor() {
  return (
    <div className="signal-monitor">
      <div className="monitor-top">
        <div><span className="live-dot" /> LIVE INDUSTRIAL SIGNAL</div>
        <span>VIRTUAL CELL · PROTOCOL-REAL</span>
      </div>
      <div className="monitor-grid">
        <div className="plant-route">
          <div className="plant-node"><small>CONTROL</small><strong>PLC-01</strong><span>MODBUS/TCP</span></div>
          <div className="route-line"><i /><span>40003</span></div>
          <div className="plant-node motor-node"><small>PROCESS</small><strong>MOTOR / DRIVE</strong><span>CONVEYOR CELL</span></div>
        </div>
        <div className="register-panel">
          <div className="micro-label">OBSERVED CONTROL EVENT</div>
          <div className="register-title"><strong>40003</strong><span>speed setpoint</span></div>
          <div className="register-change"><span>50.0</span><b>→</b><em>90.0</em></div>
          <div className="register-meter"><i /><span>80 LIMIT</span></div>
        </div>
        <div className="signal-bottom">
          <div><small>PROCESS TELEMETRY</small><strong>90.0 <span>%</span></strong><label>ACTUAL SPEED</label></div>
          <div><small>IMPACT</small><strong className="danger-text">DEGRADED</strong><label>PROCESS STATE</label></div>
          <div><small>RISK</small><strong className="danger-text">CRITICAL</strong><label>EVIDENCE GROUNDED</label></div>
        </div>
      </div>
      <div className="monitor-chain">
        <span className="done">EVENT</span><i /><span className="done">DETECT</span><i /><span className="done">PROCESS</span><i /><span className="alert">IMPACT</span><i /><span>RESPONSE</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> INDUSTRIAL INCIDENT INTELLIGENCE</div>
          <h1>Detect the threat.<br/><em>Trace the impact.</em><br/>Decide the response.</h1>
          <p className="hero-lede">PermiSense connects industrial communication, asset context, process behavior and controlled response into one explainable security workflow.</p>
          <div className="hero-actions">
            <Link href="/console" className="button button-primary">Enter operator console <ArrowRight size={16} /></Link>
            <Link href="/console/lab" className="button button-secondary">Open protocol-real demo lab <ArrowRight size={16} /></Link>
            <a href="#evidence" className="button button-secondary">See the evidence model <ArrowRight size={16} /></a>
          </div>
          <div className="hero-proof">
            <div><CheckCircle2 size={15} /> Real Modbus/TCP path</div>
            <div><CheckCircle2 size={15} /> Deterministic detection</div>
            <div><CheckCircle2 size={15} /> Human approval gate</div>
          </div>
        </div>
        <div className="hero-visual"><SignalMonitor /></div>
      </section>

      <section className="signal-strip">
        <div className="shell signal-grid">
          <div><span className="signal-key">CELL</span><strong>MANUFACTURING-CELL-01</strong></div>
          <div><span className="signal-key">ASSET</span><strong>PLC-01 / MODBUS TCP</strong></div>
          <div><span className="signal-key">PROCESS</span><strong>CONVEYOR / MOTOR DRIVE</strong></div>
          <div><span className="signal-key">MODE</span><strong className="state-ok"><span /> HUMAN-CONTROLLED</strong></div>
        </div>
      </section>

      <section id="system" className="section shell">
        <div className="section-heading">
          <div><SectionLabel>Why PermiSense</SectionLabel><h2>A suspicious write is only the beginning.</h2></div>
          <p>Industrial security becomes operationally useful when the system can connect a communication event to the asset, process behavior, evidence, impact and the next safe action.</p>
        </div>
        <div className="problem-grid">
          <div className="problem-card problem-card-main"><span className="card-index">01</span><CircleAlert size={22}/><h3>CONTROL EVENT</h3><p>Register <strong>40003</strong> changes from <strong>50.0 → 90.0</strong>.</p><div className="mini-event"><span>MODBUS/TCP</span><span>PLC-01</span></div></div>
          <div className="problem-arrow"><ArrowRight/></div>
          <div className="problem-card"><span className="card-index">02</span><Activity size={22}/><h3>PROCESS EVIDENCE</h3><p>Actual speed reaches <strong>90.0</strong>, above the <strong>80.0</strong> threshold.</p><div className="mini-meter"><span/></div></div>
          <div className="problem-arrow"><ArrowRight/></div>
          <div className="problem-card"><span className="card-index">03</span><Waypoints size={22}/><h3>INCIDENT CONTEXT</h3><p>Cyber and process evidence form one explainable incident and response path.</p><div className="mini-tags"><span>IMPACT</span><span>RISK</span><span>ACTION</span></div></div>
        </div>
      </section>

      <section className="chain-section">
        <div className="shell">
          <div className="section-heading chain-heading">
            <div><SectionLabel>The PermiSense evidence chain</SectionLabel><h2>EVENT <span>→</span> RECOVERY</h2></div>
            <p>Every stage has a concrete source in the system. The interface exposes the chain instead of hiding it behind a single alert score.</p>
          </div>
          <div className="chain">
            {chain.map(([label, text], index) => (
              <div className="chain-item" key={label}>
                <div className="chain-node"><span>{String(index + 1).padStart(2, "0")}</span><div className="chain-line"/></div>
                <div><span className="chain-label">{label}</span><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading"><div><SectionLabel>System capabilities</SectionLabel><h2>Built around the industrial event lifecycle.</h2></div></div>
        <div className="capability-grid">
          {capabilities.map(({icon: Icon, eyebrow, title, text}) => (
            <article className="capability-card" key={eyebrow}><div className="capability-icon"><Icon size={20}/></div><span>{eyebrow}</span><h3>{title}</h3><p>{text}</p><ArrowRight className="capability-arrow" size={17}/></article>
          ))}
        </div>
      </section>

      <section id="evidence" className="section shell">
        <div className="evidence-panel">
          <div className="evidence-copy">
            <SectionLabel>Evidence model</SectionLabel>
            <h2>Make the reasoning inspectable.</h2>
            <p>PermiSense preserves the evidence that supports an incident: the control event, detection, process telemetry, impact, MITRE mapping and risk factors.</p>
            <div className="evidence-facts"><div><span>REGISTER</span><strong>40003</strong></div><div><span>CHANGE</span><strong>50.0 → 90.0</strong></div><div><span>PROCESS</span><strong>90.0 %</strong></div><div><span>THRESHOLD</span><strong>80.0 %</strong></div></div>
          </div>
          <div className="evidence-graph" aria-label="Evidence relationship preview">
            <div className="graph-node graph-control"><small>01 · EVENT</small><strong>40003</strong><span>50 → 90</span></div>
            <div className="graph-node graph-detection"><small>02 · DETECTION</small><strong>CONTROL WRITE</strong><span>HIGH</span></div>
            <div className="graph-node graph-process"><small>03 · PROCESS</small><strong>ACTUAL SPEED</strong><span>90 &gt; 80</span></div>
            <div className="graph-node graph-impact"><small>04 · IMPACT</small><strong>DEGRADED</strong><span>PROCESS STATE</span></div>
            <div className="graph-node graph-risk"><small>05 · RISK</small><strong>CRITICAL</strong><span>EVIDENCE GROUNDED</span></div>
            <div className="graph-wire wire-a"/><div className="graph-wire wire-b"/><div className="graph-wire wire-c"/><div className="graph-wire wire-d"/>
          </div>
        </div>
      </section>

      <section id="response" className="section shell">
        <div className="response-panel">
          <div><SectionLabel>Controlled response</SectionLabel><h2>Recovery stays behind a human approval gate.</h2><p>PermiSense does not turn an AI suggestion into an automatic plant action. The response layer validates an allowlisted playbook, records explicit approval, performs the controlled write and verifies recovery from telemetry.</p><Link href="/console/response" className="text-link">Open response workspace <ArrowRight size={15}/></Link></div>
          <div className="response-flow">
            <div className="response-step done"><span>01</span><ShieldCheck/><strong>Evidence</strong><small>Incident grounded</small></div><ArrowRight className="response-arrow"/>
            <div className="response-step active"><span>02</span><LockKeyhole/><strong>Approve</strong><small>Operator confirmation</small></div><ArrowRight className="response-arrow"/>
            <div className="response-step"><span>03</span><Zap/><strong>Execute</strong><small>Allowlisted action</small></div><ArrowRight className="response-arrow"/>
            <div className="response-step"><span>04</span><CheckCircle2/><strong>Recover</strong><small>Verify telemetry</small></div>
          </div>
        </div>
      </section>

      <section id="architecture" className="architecture-section">
        <div className="shell">
          <div className="section-heading"><div><SectionLabel>Architecture</SectionLabel><h2>A protocol-real virtual industrial cell.</h2></div><p>The prototype is hardware-independent: a real Modbus/TCP PLC simulator, process runtime, gateway and incident intelligence stack provide a reproducible industrial lab.</p></div>
          <div className="architecture-map">
            {[["01","Industrial cell","PLC + process + sensors"],["02","Telemetry","Canonical event stream"],["03","Detection","Deterministic rules"],["04","Correlation","Cyber + process evidence"],["05","Risk","Operational impact"],["06","Response","Approval + recovery"]].map(([n,title,desc]) => <div className="arch-node" key={n}><span>{n}</span><Network size={17}/><strong>{title}</strong><small>{desc}</small></div>)}
          </div>
        </div>
      </section>

      <section className="final-cta shell"><div className="cta-mark"><ShieldCheck size={19}/></div><SectionLabel>PERMISENSE</SectionLabel><h2>See the incident, not just the alert.</h2><p>Enter the console and follow a real protocol-level event through detection, process impact, response and recovery.</p><Link href="/console" className="button button-primary">Open operator console <ArrowRight size={16}/></Link></section>

      <footer className="site-footer"><div className="shell footer-inner"><div className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span><span>PERMISENSE</span></div><span>Cyber-physical incident intelligence</span><span>Protocol-real virtual industrial lab</span></div></footer>
    </main>
  );
}
