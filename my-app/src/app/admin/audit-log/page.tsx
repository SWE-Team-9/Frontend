"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminServiceReal } from "@/src/services/admin/adminService.real";
// If you have mock service, keep this:
// import { adminServiceMock } from "@/src/services/admin/adminService.mock";

import { FiClipboard } from "react-icons/fi";

interface AuditLogEntry {
  id: string;

  action_type?: string;

  admin_id: string;
  admin_name?: string;
  admin_handle?: string;

  target_user_name?: string;
  target_user_handle?: string;

  entity_type?: "USER" | "TRACK" | "COMMENT" | "PLAYLIST";
  entity_id?: string;

  notes?: string | null;
  created_at?: string;
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  pagination?: {
    totalPages: number;
  };
}

// ===============================
// SERVICE SWITCH (REAL / MOCK)
// ===============================
// You can toggle via env
const service =
  process.env.NEXT_PUBLIC_USE_MOCK === "true"
    ? adminServiceReal // replace with adminServiceMock if you have it
    : adminServiceReal;

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

  // ===============================
  // FETCH LOGS (SAFE + REUSABLE)
  // ===============================
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const data: AuditLogResponse = await service.getAuditLog(page, 20);

      const safeLogs = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setLogs(safeLogs);
      setTotalPages(data?.pagination?.totalPages ?? 1);

      setError(null);
    } catch (err) {
      console.error("Audit log error:", err);
      setError("Failed to load audit log.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiClipboard className="text-orange-500" />
          Audit Log
        </h1>

        <p className="text-zinc-500 text-sm mt-1">
          Full history of admin & moderator actions
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">

        <table className="w-full text-left border-collapse">

          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">Notes</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">

            {/* LOADING */}
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-800/20 transition">

                  {/* ACTION */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        ACTION_COLORS[entry.action_type ?? ""] ??
                        "text-zinc-400 bg-zinc-800"
                      }`}
                    >
                      {entry.action_type?.replace(/_/g, " ") ?? "UNKNOWN"}
                    </span>
                  </td>

                  {/* ADMIN */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium">
                        {entry.admin_name ?? "Admin"}
                      </span>
                      <span className="text-xs text-zinc-500">
                        @{entry.admin_handle ?? "unknown"}
                      </span>
                    </div>
                  </td>

                  {/* TARGET */}
                  <td className="px-6 py-4">
                    {entry.target_user_name ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-300">
                          {entry.target_user_name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          @{entry.target_user_handle}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs italic">—</span>
                    )}
                  </td>

                  {/* ENTITY (NEW IMPORTANT FIELD) */}
                  <td className="px-6 py-4">
                    {entry.entity_type ? (
                      <div className="text-xs text-zinc-400">
                        <span className="text-orange-500 font-bold">
                          {entry.entity_type}
                        </span>
                        {" #"}
                        {entry.entity_id}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>

                  {/* NOTES */}
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-400 truncate block max-w-xs">
                      {entry.notes ?? "—"}
                    </span>
                  </td>

                  {/* TIME */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-zinc-500">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleString()
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-800 text-sm text-zinc-300 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-zinc-800 text-sm text-zinc-300 rounded-lg disabled:opacity-40"
          >
            Next
          </button>

        </div>
      )}
    </div>
  );
}