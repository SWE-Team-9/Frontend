"use client";

import React, { useState } from "react";
import { FiFlag } from "react-icons/fi";
import { ReportModal } from "./ReportModal";
import { ReportTargetType } from "@/src/services/reportService";
import { useAuthStore } from "@/src/store/useAuthStore";

interface ReportButtonProps {
  targetId: string;
  targetType: ReportTargetType;
  targetLabel?: string;
  className?: string;
  iconSize?: number;
}

export function ReportButton({
  targetId,
  targetType,
  targetLabel,
  className = "",
  iconSize = 16,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        title={`Report this ${targetType.toLowerCase()}`}
        aria-label={`Report ${targetType.toLowerCase()}`}
        className={`p-1.5 rounded-lg text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 transition-colors ${className}`}
      >
        <FiFlag size={iconSize} />
      </button>

      {isOpen && (
        <ReportModal
          targetId={targetId}
          targetType={targetType}
          targetLabel={targetLabel}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
