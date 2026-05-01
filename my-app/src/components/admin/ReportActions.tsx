"use client";

import { useAdminStore } from "@/src/store/useAdminStore";

export function ReportActions({ reportId }: { reportId: string }) {
  const updateReportStatus = useAdminStore((s) => s.updateReportStatus);

  return (
    <div className="flex gap-2">
      <button onClick={() => updateReportStatus(reportId, "RESOLVED")}>
        Resolve
      </button>

      <button onClick={() => updateReportStatus(reportId, "REJECTED")}>
        Reject
      </button>
    </div>
  );
}