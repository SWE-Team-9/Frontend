"use client";

import { useState } from "react";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import { useAdminStore } from "@/src/store/useAdminStore";

export function ReportActions({ reportId }: { reportId: string }) {
  const updateReportStatus = useAdminStore((s) => s.updateReportStatus);

  const [loadingAction, setLoadingAction] = useState<"RESOLVED" | "REJECTED" | null>(null);

  const handleAction = async (status: "RESOLVED" | "REJECTED") => {
    try {
      setLoadingAction(status);
      await updateReportStatus(reportId, status);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Resolve */}
      <button
        onClick={() => handleAction("RESOLVED")}
        disabled={loadingAction !== null}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50"
      >
        {loadingAction === "RESOLVED" ? (
          <FiLoader className="animate-spin" size={14} />
        ) : (
          <FiCheckCircle size={14} />
        )}
        <span className="text-sm font-medium">Resolve</span>
      </button>

      {/* Reject */}
      <button
        onClick={() => handleAction("REJECTED")}
        disabled={loadingAction !== null}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
      >
        {loadingAction === "REJECTED" ? (
          <FiLoader className="animate-spin" size={14} />
        ) : (
          <FiXCircle size={14} />
        )}
        <span className="text-sm font-medium">Reject</span>
      </button>
    </div>
  );
}