import { io, type Socket } from "socket.io-client";
import { TOKEN_KEY } from "../api/client";

// Lazily-created Socket.io client authenticated with the stored JWT. Used for
// real-time chat (FR-13) and live delivery tracking (FR-33/34).
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
