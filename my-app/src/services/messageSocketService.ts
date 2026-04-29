import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export function getMessageSocket() {
  if (!SOCKET_URL) {
    throw new Error("NEXT_PUBLIC_SOCKET_URL is not defined");
  }

  if (!socket) {
    socket = io(`${SOCKET_URL}/messages`, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });
  }

  return socket;
}

export function connectMessageSocket() {
  const s = getMessageSocket();

  if (!s.connected) {
    s.connect();
  }

  return s;
}

export function disconnectMessageSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}