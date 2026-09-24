"use client";

import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { api } from "@/lib/api";
import type { Incident } from "@/types/industrial";

export default function IncidentsPage() {
 const [incidents,setIncidents]=useState<Incident[]>([]); const [error,setError]=useState("");
 const load=()=>api<{count:number;incidents:Incident[]}>("/api/incidents").then(r=>setIncidents(r.incidents)).catch(e=>setError(e.message));
 useEffect(()=>{load()},[]);
 return <ConsoleShell>
  <div className="console-title-row"><div><div className="section-label"><span/> INCIDENTS</div><h1>Investigation queue</h1><p>Correlations produced by the backend detection and process-impact pipeline.</p></div><button className="button button-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button></div>
  {error&&<div className="error-banner"><AlertTriangle size={15}/>{error}</div>}
  <div className="incident-list">
   {incidents.length===0&&!error?<div className="empty-state large"><AlertTriangle size={30}/><strong>No correlated incidents</strong><p>Run the industrial attack demo to create a real incident.</p></div>:
   incidents.map(i=><Link className="incident-row" href={`/console/incidents/${i.incident_id}`} key={i.incident_id}>
    <span className={`incident-severity severity-${i.severity.toLowerCase()}`}>{i.severity}</span>
    <div><strong>{i.title}</strong><p>{i.reason}</p></div><div className="incident-meta"><span>{i.asset_id}</span><span>{new Date(i.timestamp).toLocaleString()}</span></div><ArrowRight size={16}/>
   </Link>)}
  </div>
 </ConsoleShell>;
}
