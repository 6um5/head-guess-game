import { io, Socket } from "socket.io-client";
import { getStoredSessionId, setStoredSessionId } from "@/lib/sessionStorage";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://head-guess-game-1.onrender.com";

export interface SessionPayload {
  sessionId: string;
  userId: string;
}

let socket: Socket | null = null;

function createSocketInstance(): Socket {
  const storedSessionId = getStoredSessionId();

  const instance = io(SOCKET_URL, {
    autoConnect: false,
    auth: storedSessionId ? { sessionId: storedSessionId } : {},
  });

  instance.on("session", (payload: SessionPayload) => {
    setStoredSessionId(payload.sessionId);
  });

  return instance;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = createSocketInstance();
  }

  return socket;
}

export function connectSocket(): Socket {
  const instance = getSocket();

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function resetSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
