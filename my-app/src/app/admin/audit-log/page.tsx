"use client";

import React, { useEffect, useState } from "react";
import { adminServiceReal } from "@/src/services/admin/adminService.real";
import { FiClipboard } from "react-icons/fi";

interface AuditLogEntry {
  id: string;
  action_type: string;
  admin_id: string;
  admin_name?: string;
  admin_handle?: string;
  target_user_name?: string;
  target_user_handle?: string;
  track_id?: string | null;
  comment_id?: string | null;
  report_id?: string | null;
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
  HIDE_COMMENT: "text-blue-500 bg-blue-500/10",
  HIDE_PLAYLIST: "text-blue-500 bg-blue-500/10",
  REMOVE_PLAYLIST: "text-red-500 bg-red-500/10",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminServiceReal
      .getAuditLog(page, 20)
      .then((data) => {
        if (cancelled) return;
        setLogs(data.items ?? data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setError(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load audit log.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiClipboard className="text-orange-500" />
          Audit Log
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Full history of admin and moderator actions
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
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Notes</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500" />
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic text-sm">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ACTION_COLORS[entry.action_type] ?? "text-zinc-400 bg-zinc-800"}`}>
                      {entry.action_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium">{entry.admin_name ?? "Admin"}</span>
                      {entry.admin_handle && (
                        <span className="text-xs text-zinc-500">@{entry.admin_handle}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {entry.target_user_name ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-300">{entry.target_user_name}</span>
                        {entry.target_user_handle && (
                          <span className="text-xs text-zinc-500">@{entry.target_user_handle}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-400 max-w-xs truncate block">
                      {entry.notes ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-zinc-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-zinc-500 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
