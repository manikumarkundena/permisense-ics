"use client";

import { AlertTriangle, CheckCircle2, LockKeyhole, Play, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import type { Incident } from "@/types/industrial";

type Plan = { action: string; register_address?: number; target_value?: number; reason?: string; requires_human_approval?: boolean; approved?: boolean; executed?: boolean; recovered?: boolean; actual_speed?: number; };

export default function ResponsePage() {
  const [incidents,setIncidents]=useState<Incident[]>([]);
  const [plan,setPlan]=useState<Plan|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{api<Incident[]>("/api/incidents").then(setIncidents).catch(()=>{});},[]);
  const incident=incidents[0];
  useEffect(()=>{if(incident) api<Plan>(`/api/incidents/${incident.correlation_id}/response`).then(setPlan).catch(()=>{});},[incident]);

  async function approve(){
    if(!incident||!plan)return;
    setBusy(true);setMessage("");
    try {
      const result=await api<Plan>(`/api/incidents/${incident.correlation_id}/response/approve`,{method:"POST",body:JSON.stringify({action:plan.action,approved_by:"operator"})});
      setPlan(result);setMessage("Response executed. Verify recovery to close the operational loop.");
    } catch(e){setMessage(e instanceof Error?e.message:"Response failed");} finally{setBusy(false);}
  }
  async function verify(){
    if(!incident)return;
    setBusy(true);
    try { const result=await api<Plan>(`/api/incidents/${incident.correlation_id}/response/verify`,{method:"POST"});setPlan(result);setMessage(result.recovered?"Process recovery verified.":"Recovery not yet verified."); }
    catch(e){setMessage(e instanceof Error?e.message:"Verification failed");} finally{setBusy(false);}
  }

  return <ConsoleShell>
    <div className="console-title-row"><div><div className="section-label"><span /> CONTROLLED RESPONSE</div><h1>Human-approved response</h1><p>Only backend-allowlisted actions can be executed from this workspace.</p></div></div>
    {!incident ? <div className="empty-state large"><AlertTriangle size={30}/><strong>No incident available</strong><p>Run the attack demo to create a response plan.</p></div> :
    <div className="response-workspace">
      <div className="response-main">
        <section className="response-command">
          <div className="response-command-top"><span>RECOMMENDATION</span><LockKeyhole size={18}/></div>
          <h2>{plan?.action?.replaceAll("_"," ").toUpperCase() ?? "LOADING RESPONSE"}</h2>
          <p>{plan?.reason ?? "Loading the backend response plan…"}</p>
          <div className="register-change"><div><small>REGISTER</small><strong>{plan?.register_address ?? "—"}</strong></div><div><small>CURRENT</small><strong>90.0</strong></div><div className="arrow">→</div><div><small>TARGET</small><strong>{plan?.target_value ?? "—"}</strong></div></div>
          <div className="approval-warning"><AlertTriangle size={17}/><div><strong>HUMAN APPROVAL REQUIRED</strong><span>The action will be sent to PLC-01 through the backend response engine.</span></div></div>
          <button className="approve-button" disabled={busy||plan?.executed} onClick={approve}>{plan?.executed?<><CheckCircle2/> Executed</>:<><Play/> Approve & execute</>}</button>
          {plan?.executed && <button className="verify-button" disabled={busy||plan?.recovered} onClick={verify}>{plan?.recovered?<><ShieldCheck/> Recovery verified</>:<><Target/> Verify recovery</>}</button>}
          {message&&<div className="response-message">{message}</div>}
        </section>
        <section className="console-panel">
          <div className="panel-header"><div><span>RESPONSE LIFECYCLE</span><h2>Evidence → approval → recovery</h2></div><ShieldCheck size={18}/></div>
          <div className="response-lifecycle"><span className="done">01 Evidence</span><span className={plan?.approved?"done":""}>02 Approval</span><span className={plan?.executed?"done":""}>03 Execution</span><span className={plan?.recovered?"done":""}>04 Recovery</span></div>
        </section>
      </div>
    </div>}
  </ConsoleShell>;
}
