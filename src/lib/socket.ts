import { io, type Socket } from "socket.io-client";
import { TOKEN_KEY } from "../api/client";

// Lazily-created Socket.io client authenticated with the stored JWT, for
// real-time chat (FR-13) and live delivery tracking (FR-33/34).
//
// CURRENTLY UNUSED. The API is deployed to a serverless host, which cannot hold
// WebSocket connections open, so the UI polls the REST endpoints via
// hooks/usePolling instead. This module is the client half of the self-hosted
// path — src/server.ts on the backend still calls initIo() — and is kept so
// real-time can be switched back on by re-subscribing in NotificationsBell,
// Messages and OrderTracking if the API moves to a WebSocket-capable host.
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    socket = io(base, {
      auth: { token: localStorage.getItem(TOKEN_KEY) },
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/** Recreate the socket (e.g. after login/logout changes the token). */
export function resetSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
