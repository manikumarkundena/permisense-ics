"use client";

import { useEffect, useRef, useState } from "react";
import { createEventSocket } from "@/lib/websocket";
import type { LiveEvent } from "@/types/industrial";

export function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [state, setState] = useState<"connecting" | "open" | "closed">("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      const socket = createEventSocket((value) => {
        if (value && typeof value === "object") {
          setEvents((current) => [value as LiveEvent, ...current].slice(0, 80));
        }
      }, setState);
      socketRef.current = socket;
      socket.addEventListener("close", () => {
        timer = setTimeout(connect, 2500);
      });
    };
    connect();
    return () => {
      if (timer) clearTimeout(timer);
      socketRef.current?.close();
    };
  }, []);

  return { events, state };
}
