"use client";

import Link from "next/link";
import { FiUser } from "react-icons/fi";
import { useAdminStore } from "@/src/store/useAdminStore";
import{Report} from "@/src/types/admin";

interface OffenderCardProps {
  report: Report;
}

export function OffenderCard({ report }: OffenderCardProps) {
  const users = useAdminStore((s) => s.users);

  // Find the offender based on the report target
  const offender = users.find((u) => {
    if (report.target.type === "USER") {
      return u.id === report.target.id;
    }

    const targetHandle = report.target.owner_handle?.toLowerCase();
    const userHandle = u.handle?.toLowerCase();

    return targetHandle && userHandle === targetHandle;
  });

  const isActive = offender?.account_status === "ACTIVE";
  const statusColor = isActive ? "text-green-500" : "text-red-500";
  const statusBg = isActive ? "bg-green-500" : "bg-red-500";

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl ring-1 ring-red-500/20">
      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">
        Live Offender Status
      </p>

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <FiUser className="text-zinc-400" />
          </div>
          
          {/* Real-time Status Indicator */}
          <div 
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${statusBg}`} 
          />
        </div>

        <div>
          <p className="text-white font-bold text-sm">
            {offender?.display_name || report.target.owner_handle || "Unknown User"}
          </p>
          <p className="text-zinc-500 text-[10px] font-mono">
            Status:{" "}
            <span className={statusColor}>
              {offender?.account_status || "NOT FOUND"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <Link
          href={`/admin/users/${offender?.id || report.target.owner_handle}`}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-xl transition-all border border-white/5"
        >
          Manage Full Account
        </Link>
      </div>
    </div>
  );
}