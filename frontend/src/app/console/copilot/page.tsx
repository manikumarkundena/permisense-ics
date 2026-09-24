"use client";

import { Bot, CheckCircle2, CircleAlert, Send, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import { useLiveEvents } from "@/hooks/use-live-events";
import type { Incident } from "@/types/industrial";

type CopilotResult = { incident_id: string; grounded: boolean; copilot: { summary: string; evidence: string[] | string; impact: string; recommended_action: string; confidence_note: string; } };
type ChatResult = { incident_id: string; grounded: boolean; question: string; copilot: { answer: string; evidence_used: string[] | string; action_advisory: string; limitation: string; } };
type Message = { role: "operator" | "copilot"; text: string; evidence?: string };

function incidentTitle(incident: Incident) {
  const register = Number(incident.control?.register_address);
  if (register === 40002) return "Unauthorized operating mode change";
  if (register === 40003) return "Unauthorized speed setpoint change";
  if (register === 40004) return "Unauthorized acceleration limit change";
  if (register === 40005) return "Unauthorized production target change";
  return incident.title || "Industrial control incident";
}

const prompts = [
  "Why was this incident classified as critical?",
  "What evidence proves the process was affected?",
  "Which MITRE ICS techniques are supported?",
  "What response is available and what requires approval?",
];

export default function CopilotPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const { correlationVersion } = useLiveEvents();

  const load = () => api<{ count:number; incidents:Incident[] }>("/api/incidents").then((r) => {
    setIncidents(r.incidents);
    setSelectedIncidentId((current) => current && r.incidents.some((i) => i.incident_id === current) ? current : r.incidents[0]?.incident_id ?? "");
  }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load incidents"));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (correlationVersion > 0) load(); }, [correlationVersion]);
  useEffect(() => { setResult(null); setMessages([]); }, [selectedIncidentId]);

  const incident = incidents.find((i) => i.incident_id === selectedIncidentId) ?? incidents[0] ?? null;

  async function analyze() {
    if (!incident) return;
    setAnalyzing(true); setError("");
    try { setResult(await api<CopilotResult>("/api/incidents/"+incident.incident_id+"/copilot", { method:"POST" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Copilot request failed"); }
    finally { setAnalyzing(false); }
  }

  async function ask(text = question) {
    const trimmed = text.trim();
    if (!incident || !trimmed || busy) return;
    setQuestion(""); setBusy(true); setError("");
    setMessages((current) => [...current, { role:"operator", text:trimmed }]);
    try {
      const response = await api<ChatResult>("/api/incidents/"+incident.incident_id+"/copilot/chat", { method:"POST", body:JSON.stringify({ question:trimmed }) });
      const evidence = Array.isArray(response.copilot.evidence_used) ? response.copilot.evidence_used.join(" · ") : response.copilot.evidence_used;
      setMessages((current) => [...current, { role:"copilot", text:response.copilot.answer, evidence:evidence + (response.copilot.action_advisory ? " · "+response.copilot.action_advisory : "") }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copilot chat failed");
    } finally { setBusy(false); }
  }

  return <ConsoleShell>
    <div className="console-title-row">
      <div>
        <div className="section-label"><span /> EVIDENCE-GROUNDED COPILOT</div>
        <h1>Incident intelligence for the operator</h1>
        <p>Ask questions about a persisted incident. Copilot explains evidence; the backend remains authoritative for detection, risk, response, and recovery.</p>
      </div>
    </div>

    {!incident ? <div className="empty-state large"><Bot size={30}/><strong>No incident evidence available</strong><p>Create a real correlated incident first.</p></div> : <div className="copilot-workspace">
      <section className="copilot-command console-panel">
        <div className="panel-header"><div><span>INCIDENT CONTEXT</span><h2>{incidentTitle(incident)}</h2></div><ShieldAlert size={18}/></div>
        <div className="response-incident-list">
          {incidents.map((item) => <button key={item.incident_id} className={item.incident_id===incident.incident_id ? "selected":""} onClick={() => setSelectedIncidentId(item.incident_id)}>
            <span>{item.incident_id.slice(0,8)}</span><strong>{incidentTitle(item)}</strong><small>{item.asset_id} · {item.status ?? "open"}</small>
          </button>)}
        </div>
        <div className="copilot-evidence-strip"><span>{incident.asset_id}</span><span>{incident.severity}</span><span>{incident.process_id}</span><span>GROUNDED INPUT</span></div>
        <div className="copilot-actions"><button className="approve-button" disabled={analyzing} onClick={analyze}><Send size={15}/>{analyzing ? "Analyzing evidence…" : "Generate incident brief"}</button><span>AI is an optional interpretation layer; detection and response remain backend-authoritative.</span></div>
        {error && <div className="error-banner"><CircleAlert size={14}/><div><strong>Copilot unavailable</strong><span>{error.includes("503") ? "Gemini is not configured on the backend. Add GEMINI_API_KEY to enable generated analysis." : "The evidence pipeline is still available. Check the Gemini configuration or upstream service and retry."}</span></div></div>}
      </section>

      {result && <section className="copilot-result">
        <div className="grounded-banner"><CheckCircle2 size={15}/><strong>GROUNDED INPUT</strong><span>Generated from persisted incident evidence.</span></div>
        <article className="copilot-answer"><span>SUMMARY</span><h2>{result.copilot.summary}</h2></article>
        <div className="copilot-answer-grid">
          <article className="copilot-answer"><span>EVIDENCE</span><p>{Array.isArray(result.copilot.evidence) ? result.copilot.evidence.join(" · ") : result.copilot.evidence}</p></article>
          <article className="copilot-answer"><span>IMPACT</span><p>{result.copilot.impact}</p></article>
          <article className="copilot-answer"><span>RECOMMENDED ACTION</span><p>{result.copilot.recommended_action}</p></article>
          <article className="copilot-answer"><span>LIMITATION</span><p>{result.copilot.confidence_note}</p></article>
        </div>
      </section>}

      <section className="copilot-chat console-panel">
        <div className="panel-header"><div><span>OPERATOR / COPILOT</span><h2>Ask about this incident</h2></div><Bot size={18}/></div>
        <div className="grounded-banner chat-grounded"><CheckCircle2 size={15}/><strong>READ-ONLY INTELLIGENCE</strong><span>Answers use this incident&apos;s persisted evidence. Chat cannot execute or approve response actions.</span></div>
        <div className="chat-suggestions">{prompts.map((prompt) => <button key={prompt} disabled={busy} onClick={() => void ask(prompt)}>{prompt}</button>)}</div>
        <div className="chat-thread" aria-live="polite">
          {!messages.length && <div className="empty-state"><Bot size={24}/><strong>Ask a grounded question</strong><p>For example: “What evidence proves the process was affected?”</p></div>}
          {messages.map((message,index) => <div className={"chat-message "+message.role} key={index}>
            <div className="chat-avatar">{message.role==="operator" ? <UserRound size={14}/> : <Bot size={14}/>}</div>
            <div><span>{message.role==="operator" ? "OPERATOR" : "COPILOT"}</span><p>{message.text}</p>{message.evidence && <small>EVIDENCE · {message.evidence}</small>}</div>
          </div>)}
        </div>
        <form className="chat-input-row" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1200} placeholder="Ask about evidence, impact, MITRE mapping, or response…" disabled={busy}/>
          <button type="submit" disabled={busy || !question.trim()}><Send size={15}/>{busy ? "…" : "Ask"}</button>
        </form>
      </section>
    </div>}
  </ConsoleShell>;
}
