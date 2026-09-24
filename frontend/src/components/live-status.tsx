"use client";

import { Radio } from "lucide-react";

export function LiveStatus({ state }: { state: "connecting" | "open" | "closed" }) {
  const label = state === "open" ? "LIVE STREAM" : state === "connecting" ? "CONNECTING" : "STREAM OFFLINE";
  return <span className={`live-status live-${state}`}><span /><Radio size={12} />{label}</span>;
}
