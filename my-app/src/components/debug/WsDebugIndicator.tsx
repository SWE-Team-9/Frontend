"use client";

import { useState } from "react";
import { useWsDebugStore, WsStatus } from "@/src/store/wsDebugStore";

const STATUS_CONFIG: Record<WsStatus, { dot: string; label: string }> = {
  idle:         { dot: "bg-zinc-500",  label: "idle"         },
  connecting:   { dot: "bg-yellow-400 animate-pulse", label: "connecting" },
  connected:    { dot: "bg-green-400", label: "connected"    },
  disconnected: { dot: "bg-zinc-500",  label: "disconnected" },
  error:        { dot: "bg-red-500",   label: "error"        },
};

function Dot({ status }: { status: WsStatus }) {
  const { dot } = STATUS_CONFIG[status];
  return <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />;
}

export function WsDebugIndicator() {
  const messages = useWsDebugStore((s) => s.messages);
  const notif = useWsDebugStore((s) => s.notif);
  const [expanded, setExpanded] = useState(false);

  const allOk = messages === "connected" && notif === "connected";
  const anyError = messages === "error" || notif === "error";
  const summaryDot = anyError ? "bg-red-500" : allOk ? "bg-green-400" : "bg-yellow-400 animate-pulse";

  return (
    <div className="fixed bottom-28 right-3 z-50 select-none">
      {expanded ? (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-xs text-zinc-300 min-w-[170px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
            <span className="font-semibold text-zinc-100">WebSocket</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-zinc-500 hover:text-zinc-200 cursor-pointer leading-none"
            >
              ✕
            </button>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400">messages</span>
              <span className="flex items-center gap-1.5">
                <Dot status={messages} />
                {STATUS_CONFIG[messages].label}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400">notif</span>
              <span className="flex items-center gap-1.5">
                <Dot status={notif} />
                {STATUS_CONFIG[notif].label}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          title="WS debug"
          className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer backdrop-blur-sm"
        >
          <span className={`inline-block w-2 h-2 rounded-full ${summaryDot}`} />
          WS
        </button>
      )}
    </div>
  );
}
