"use client";

import React, { useEffect, useState } from "react";
import { adminServiceReal } from "@/src/services/admin/adminService.real";
import { FiClipboard } from "react-icons/fi";

export const dynamic = "force-dynamic";

interface AuditLogEntry {
  id: string;
  action_type: string;
  admin_id: string;
  admin_name?: string;
  admin_handle?: string;
  target_user_name?: string;
  target_user_handle?: string;
  entity_type?: "USER" | "TRACK" | "COMMENT" | "PLAYLIST";
  entity_id?: string;
  notes?: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  WARN_USER: "text-yellow-500 bg-yellow-500/10",
  SUSPEND_USER: "text-orange-500 bg-orange-500/10",
  BAN_USER: "text-red-500 bg-red-500/10",
  RESTORE_CONTENT: "text-green-500 bg-green-500/10",
  HIDE_TRACK: "text-blue-500 bg-blue-500/10",
  REMOVE_TRACK: "text-red-500 bg-red-500/10",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    adminServiceReal
      .getAuditLog(page, 20)
      .then((data) => {
        const safeLogs = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        setLogs(safeLogs);
        setTotalPages(data?.pagination?.totalPages ?? 1);
        setError(null);
      })
      .catch((err) => {
        console.error("Audit log error:", err);
        setError("Failed to load audit log.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiClipboard className="text-orange-500" />
          Audit Log
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Full history of admin & moderator actions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Target User</th>
              <th className="px-6 py-4">Notes</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  Loading actions...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-800/20 transition">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        ACTION_COLORS[entry.action_type] ?? "text-zinc-400 bg-zinc-800"
                      }`}
                    >
                      {entry.action_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div>{entry.admin_name}</div>
                      <div className="text-zinc-500 text-xs">@{entry.admin_handle}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {entry.entity_id ? (entry.target_user_name ?? "—") : "—"}
                  </td>
                  <td className="px-6 py-4">{entry.notes || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-400 self-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}