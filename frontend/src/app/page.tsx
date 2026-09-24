import Link from "next/link";
import { ArrowRight, CheckCircle2, Factory, GitBranch, LockKeyhole, Radar, ShieldCheck, Sparkles, Waypoints, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const pillars = [
  { n:"01", title:"Human-centric", text:"Security intelligence supports the operator instead of hiding decisions behind automation.", icon:UsersIcon },
  { n:"02", title:"Resilient", text:"Cyber events are connected to process state, operational impact and controlled recovery.", icon:ShieldCheck },
  { n:"03", title:"Sustainable by design", text:"A hardware-independent digital industrial cell makes experimentation reproducible without pretending to be a physical plant.", icon:Factory },
];

function UsersIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.1 2.4-4.8 5.5-4.8s4.9 1.7 5.5 4.8"/><path d="M16 5.2a3 3 0 0 1 0 5.6M16.3 14.3c2.5.3 4 1.8 4.7 4.2"/></svg>;
}

const stages = [
  ["EVENT","Control register changes","MODBUS / TCP"],
  ["DETECT","Deterministic detection","CONTROL WRITE"],
  ["PROCESS","Telemetry deviates","R30001 > LIMIT"],
  ["IMPACT","Operational consequence","DEGRADED"],
  ["DECIDE","Evidence + response plan","HUMAN GATE"],
  ["RECOVER","Write → readback → verify","CLOSED LOOP"],
];

function IsometricCell() {
  return (
    <div className="iso-scene" aria-label="PermiSense virtual industrial cell">
      <div className="iso-glow"/>
      <div className="iso-grid"/>
      <div className="iso-floor"/>
      <div className="iso-line iso-line-a"/>
      <div className="iso-line iso-line-b"/>
      <div className="iso-device iso-plc"><span>PLC-01</span><b>CONTROL</b><i/></div>
      <div className="iso-device iso-drive"><span>MOTOR</span><b>DRIVE</b><i/></div>
      <div className="iso-device iso-sensor"><span>R30001</span><b>SPEED</b><i/></div>
      <div className="iso-conveyor"><span/><span/><span/><span/></div>
      <div className="iso-orbit orbit-a"/><div className="iso-orbit orbit-b"/>
      <div className="iso-label label-one"><small>CYBER SIGNAL</small><strong>MODBUS / TCP</strong></div>
      <div className="iso-label label-two"><small>PROCESS STATE</small><strong>RUNNING</strong></div>
      <div className="iso-label label-three"><small>HUMAN GATE</small><strong>RESPONSE READY</strong></div>
      <div className="iso-scan"/>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing">
      <SiteHeader />

      <section className="hero hero-new shell">
        <div className="hero-copy hero-new-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> CYBER-PHYSICAL INCIDENT INTELLIGENCE · INDUSTRY 5.0</div>
          <h1>Security that understands <em>the process.</em></h1>
          <p className="hero-lede">PermiSense turns an industrial control change into an explainable chain of evidence — from protocol event to process impact, operational risk, human decision and verified recovery.</p>
          <div className="hero-actions">
            <Link href="/console/lab" className="button button-primary"><Sparkles size={15}/> Run the live industrial demo <ArrowRight size={15}/></Link>
            <Link href="/console" className="button button-secondary">Enter command center <ArrowRight size={15}/></Link>
          </div>
          <div className="hero-proof">
            <span><CheckCircle2 size={14}/> Real Modbus/TCP writes</span>
            <span><CheckCircle2 size={14}/> Deterministic security pipeline</span>
            <span><CheckCircle2 size={14}/> Human-approved response</span>
          </div>
        </div>
        <div className="hero-new-visual"><IsometricCell/></div>
      </section>

      <section className="hero-ribbon">
        <div className="shell ribbon-grid">
          <div><small>INDUSTRIAL CELL</small><strong>MANUFACTURING-CELL-01</strong></div>
          <div><small>CONTROLLER</small><strong>PLC-01 · MODBUS/TCP</strong></div>
          <div><small>PROCESS</small><strong>MOTOR + CONVEYOR</strong></div>
          <div><small>OPERATING MODEL</small><strong><i/> HUMAN-CONTROLLED</strong></div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div><div className="section-label"><span/> THE PRODUCT THESIS</div><h2>An alert is not an incident.<br/><em>Context makes it one.</em></h2></div>
          <p>PermiSense correlates industrial communication with the process it controls. The operator sees not just that a register changed, but what changed downstream, why the system considers it risky, what evidence supports the conclusion, and which recovery action is available.</p>
        </div>

        <div className="chain-visual">
          {stages.map(([kicker,title,detail], index) => (
            <div className={"chain-stage " + (index === 3 ? "stage-alert" : "")} key={kicker}>
              <div className="chain-stage-top"><span>{String(index+1).padStart(2,"0")}</span><span>{kicker}</span></div>
              <strong>{title}</strong><small>{detail}</small>
              {index < stages.length-1 && <ArrowRight className="chain-stage-arrow" size={16}/>}
            </div>
          ))}
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell">
          <div className="section-heading dark-heading">
            <div><div className="section-label"><span/> WHY THIS FITS INDUSTRY 5.0</div><h2>Cyber resilience becomes part of the <em>human-centered factory.</em></h2></div>
            <p>Industry 5.0 emphasizes human-centricity, sustainability and resilience. PermiSense brings those principles into industrial cybersecurity by keeping the operator in control of consequential response decisions while making cyber-to-process impact visible.</p>
          </div>
          <div className="pillar-grid">
            {pillars.map(({n,title,text,icon:Icon}) => <article className="pillar-card" key={n}><div className="pillar-top"><span>{n}</span><Icon size={19}/></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div><div className="section-label"><span/> OPERATOR WORKFLOW</div><h2>One surface from detection to recovery.</h2></div>
        </div>
        <div className="workflow-grid">
          {[
            [Radar,"01","OBSERVE","Industrial telemetry enters a canonical event model."],
            [GitBranch,"02","CORRELATE","Cyber and process evidence are linked to the same asset."],
            [Waypoints,"03","UNDERSTAND","Impact, ATT&CK context and risk remain inspectable."],
            [LockKeyhole,"04","RESPOND","An allowlisted action waits behind human approval."],
          ].map(([Icon,n,title,text]) => <article className="workflow-card" key={n}><div className="workflow-icon"><Icon size={19}/></div><span>{n} / {title}</span><h3>{text}</h3><ArrowRight size={16}/></article>)}
        </div>
      </section>

      <section className="section shell">
        <div className="demo-banner">
          <div><div className="section-label"><span/> PROTOCOL-REAL DEMO LAB</div><h2>Don’t simulate the alert. <em>Trigger the industrial event.</em></h2><p>The demo control invokes backend scenario endpoints that perform real Modbus/TCP writes against the virtual PLC. The same gateway, detection, correlation, risk, incident, response and verification path then handles the result.</p></div>
          <Link href="/console/lab" className="button button-primary">Open demo lab <ArrowRight size={15}/></Link>
        </div>
      </section>

      <section className="section architecture-section">
        <div className="shell">
          <div className="section-heading">
            <div><div className="section-label"><span/> ARCHITECTURE</div><h2>Protocol-real. Hardware-independent. Evidence-first.</h2></div>
            <p>The current prototype uses a virtual industrial cell because physical PLC hardware is unavailable. That boundary is explicit; the communication and response path remains protocol-real and designed for future hardware deployment.</p>
          </div>
          <div className="arch-flow">
            {["VIRTUAL CELL","TELEMETRY","DETECTION","CORRELATION","IMPACT + RISK","HUMAN RESPONSE"].map((item,index) => <div key={item} className="arch-flow-item"><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong>{index<5 && <ArrowRight size={14}/>}</div>)}
          </div>
        </div>
      </section>

      <section className="final-cta shell">
        <div className="cta-mark"><ShieldCheck size={19}/></div>
        <div><div className="section-label"><span/> PERMISENSE</div><h2>Detect the threat. Trace the impact. Decide the response.</h2><p>Enter the command center or run the protocol-real industrial demonstration.</p></div>
        <div className="cta-actions"><Link href="/console" className="button button-primary">Command center <ArrowRight size={15}/></Link><Link href="/console/lab" className="button button-secondary">Demo lab <ArrowRight size={15}/></Link></div>
      </section>

      <footer className="site-footer"><div className="shell footer-inner"><div className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span><span>PERMISENSE</span></div><span>Cyber-physical incident intelligence</span><span>Industry 5.0 · human-centric resilience</span></div></footer>
    </main>
  );
}
