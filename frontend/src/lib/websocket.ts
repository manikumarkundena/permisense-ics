import { apiBase } from "./api";

export function createEventSocket(onMessage: (value: unknown) => void, onState?: (state: "connecting" | "open" | "closed") => void) {
  const url = apiBase.replace(/^http/, "ws") + "/ws/events";
  const socket = new WebSocket(url);
  onState?.("connecting");
  socket.onopen = () => onState?.("open");
  socket.onmessage = (event) => {
    try { onMessage(JSON.parse(event.data)); } catch { /* ignore malformed frames */ }
  };
  socket.onclose = () => onState?.("closed");
  return socket;
}
