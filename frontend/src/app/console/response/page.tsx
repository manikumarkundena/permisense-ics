"use client";

import { AlertTriangle, CheckCircle2, LockKeyhole, Play, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import type { Incident, RecoveryResult, ResponseExecution, ResponsePlan } from "@/types/industrial";

export default function ResponsePage(){
 const [incidents,setIncidents]=useState<Incident[]>([]); const [plan,setPlan]=useState<ResponsePlan|null>(null);
 const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const incident=incidents[0];
 useEffect(()=>{api<{count:number;incidents:Incident[]}>("/api/incidents").then(r=>setIncidents(r.incidents)).catch(()=>{});},[]);
 useEffect(()=>{if(incident)api<ResponsePlan>(`/api/incidents/${incident.incident_id}/response`).then(setPlan).catch(()=>{});},[incident]);
 const rec=plan?.recommendations?.[0];
 async function approve(){if(!incident||!rec)return;setBusy(true);setMessage("");try{const r=await api<ResponseExecution>(`/api/incidents/${incident.incident_id}/response/approve`,{method:"POST",body:JSON.stringify({action:rec.action,approved_by:"operator"})});setPlan(p=>p?{...p,approved:true,executed:true}:p);setMessage(`Executed via ${String(r.response.execution_method??"backend")} · execution ${String(r.response.execution_id??"recorded")}`);}catch(e){setMessage(e instanceof Error?e.message:"Response failed")}finally{setBusy(false)}}
 async function verify(){if(!incident)return;setBusy(true);try{const r=await api<RecoveryResult>(`/api/incidents/${incident.incident_id}/response/verify`,{method:"POST"});setPlan(p=>p?{...p,recovered:r.recovered}:p);setMessage(r.recovered?`Recovery verified · actual speed ${r.actual_speed.toFixed(1)} ≤ ${r.threshold.toFixed(1)}`:`Recovery not verified · actual speed ${r.actual_speed.toFixed(1)}`)}catch(e){setMessage(e instanceof Error?e.message:"Verification failed")}finally{setBusy(false)}}
 return <ConsoleShell>
  <div className="console-title-row"><div><div className="section-label"><span/> CONTROLLED RESPONSE</div><h1>Human-approved response</h1><p>Only backend-allowlisted actions can be executed from this workspace.</p></div></div>
  {!incident||!plan?<div className="empty-state large"><AlertTriangle size={30}/><strong>No response plan available</strong><p>Run the attack demo and create a correlated incident first.</p></div>:
  <div className="response-workspace">
   <section className="response-command">
    <div className="response-command-top"><span>RECOMMENDATION</span><LockKeyhole size={18}/></div>
    <h2>{rec?.action.replaceAll("_"," ").toUpperCase()}</h2><p>{rec?.description}</p>
    <div className="register-change"><div><small>REGISTER</small><strong>{rec?.register_address}</strong></div><div><small>CURRENT</small><strong>90.0</strong></div><div className="arrow">→</div><div><small>TARGET</small><strong>{rec?.target_value.toFixed(1)}</strong></div></div>
    <div className="approval-warning"><AlertTriangle size={17}/><div><strong>HUMAN APPROVAL REQUIRED</strong><span>The backend validates and executes the allowlisted Modbus response. AI cannot approve it.</span></div></div>
    {!plan.executed?<button className="approve-button" disabled={busy} onClick={approve}><Play size={15}/> {busy?"Executing…":"Approve & execute"}</button>:<div className="response-message"><CheckCircle2 size={15}/> Response executed and recorded.</div>}
    {plan.executed&&<button className="verify-button" disabled={busy||plan.recovered} onClick={verify}>{plan.recovered?<><ShieldCheck/> Recovery verified</>:<><Target/> Verify recovery</>}</button>}
    {message&&<div className="response-message">{message}</div>}
   </section>
   <section className="console-panel"><div className="panel-header"><div><span>RESPONSE LIFECYCLE</span><h2>Evidence → approval → recovery</h2></div><ShieldCheck size={18}/></div>
    <div className="response-lifecycle"><span className="done">01 Evidence</span><span className={plan.approved?"done":""}>02 Approval</span><span className={plan.executed?"done":""}>03 Execution</span><span className={plan.recovered?"done":""}>04 Recovery</span></div>
   </section>
  </div>}
 </ConsoleShell>
}
