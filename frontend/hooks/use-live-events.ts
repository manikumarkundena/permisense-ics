'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryEvent } from '@/lib/types';

export type StreamConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

type BackendLiveMessage = {
  type?: string;
  status?: string;
  event?: {
    event_id: string;
    timestamp: string;
    event_type: string;
    asset_id: string;
    process_id?: string | null;
    register_address?: number | null;
    value?: number | null;
    unit?: string | null;
    severity?: string | null;
  };
};

function getWebSocketUrl() {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;

  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) throw new Error('NEXT_PUBLIC_API_URL must be configured');

  return api.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/\/$/, '') + '/ws/events';
}

function mapBackendEvent(message: BackendLiveMessage): TelemetryEvent | null {
  if (message.type !== 'telemetry' || !message.event?.event_id) return null;
  const event = message.event;

  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    channel: 'PLC_TELEMETRY',
    source: event.asset_id,
    event_type: event.event_type.toUpperCase() as TelemetryEvent['event_type'],
    register: event.register_address != null ? String(event.register_address) : undefined,
    value: event.value ?? undefined,
    unit: event.unit ?? undefined,
    message: `${event.event_type} on ${event.asset_id}${event.register_address != null ? ` · register ${event.register_address}` : ''}`,
    raw_payload: message as unknown as Record<string, unknown>,
  };
}

export function useLiveEvents(_initialLimit = 50) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('CONNECTING');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    socketRef.current?.close();
    setConnectionState(reconnectAttemptsRef.current === 0 ? 'CONNECTING' : 'RECONNECTING');

    let socket: WebSocket;
    try {
      socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;
    } catch (err) {
      setConnectionState('DISCONNECTED');
      setError(err instanceof Error ? err.message : 'WebSocket connection failed');
      return;
    }

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionState('CONNECTED');
      reconnectAttemptsRef.current = 0;
      setError(null);
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as BackendLiveMessage;
        const mapped = mapBackendEvent(parsed);
        if (mapped) setEvents((prev) => [mapped, ...prev].slice(0, 100));
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Invalid live event payload');
        }
      }
    };

    socket.onerror = () => {
      if (mountedRef.current) setError('Live WebSocket connection error');
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setConnectionState('DISCONNECTED');
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      socketRef.current?.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [connect]);

  const refresh = useCallback(() => {
    // No synthetic polling. The authoritative backend owns the live stream.
  }, []);

  return { events, connectionState, error, refresh };
}
