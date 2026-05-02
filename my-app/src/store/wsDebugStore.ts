import { create } from "zustand";

export type WsStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface WsDebugState {
  messages: WsStatus;
  notif: WsStatus;
  setMessages: (s: WsStatus) => void;
  setNotif: (s: WsStatus) => void;
}

export const useWsDebugStore = create<WsDebugState>((set) => ({
  messages: "idle",
  notif: "idle",
  setMessages: (s) => set({ messages: s }),
  setNotif: (s) => set({ notif: s }),
}));