"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { createEventSocket } from "@/lib/websocket";
import type { LiveEvent } from "@/types/industrial";

type TelemetryEnvelope = {
  type?: string;
  event?: LiveEvent;
  correlations?: Array<Record<string, unknown>>;
};

export function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [state, setState] = useState<"connecting" | "open" | "closed">("connecting");
  const [correlationVersion, setCorrelationVersion] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    api<{ count: number; events: LiveEvent[] }>("/api/telemetry/events?limit=80")
      .then((result) => {
        if (!cancelled) {
          setEvents(result.events);
        }
      })
      .catch(() => {
        // Live WebSocket connection can still populate the stream.
      });

    const addEvent = (event: LiveEvent) => {
      if (!event?.event_id || !event.timestamp) return;

      setEvents((current) => {
        if (current.some((item) => item.event_id === event.event_id)) {
          return current;
        }
        return [event, ...current].slice(0, 80);
      });
    };

    const connect = () => {
      const socket = createEventSocket((value) => {
        if (!value || typeof value !== "object") return;

        const message = value as TelemetryEnvelope;
        if (message.type !== "telemetry" || !message.event) {
          return;
        }

        addEvent(message.event);

        if ((message.correlations?.length ?? 0) > 0) {
          setCorrelationVersion((version) => version + 1);
        }
      }, setState);

      socketRef.current = socket;
      socket.addEventListener("close", () => {
        if (!cancelled) {
          timer = setTimeout(connect, 2500);
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      socketRef.current?.close();
    };
  }, []);

  return { events, state, correlationVersion };
}
