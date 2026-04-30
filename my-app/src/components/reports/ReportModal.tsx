"use client";

import React, { useState } from "react";
import { reportService, ReportTargetType, ReportReason } from "@/src/services/reportService";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface ReportModalProps {
  targetId: string;
  targetType: ReportTargetType;
  targetLabel?: string;
  onClose: () => void;
}

const REASON_LABELS: Record<ReportReason, string> = {
  COPYRIGHT: "Copyright Infringement",
  INAPPROPRIATE: "Inappropriate Content",
  SPAM: "Spam",
};

export function ReportModal({ targetId, targetType, targetLabel, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await reportService.createReport({
        targetId,
        targetType,
        reason,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; code?: string } } };
      const code = axiosErr?.response?.data?.code;
      if (code === "DUPLICATE_REPORT") {
        setError("You have already reported this content.");
      } else {
        setError(axiosErr?.response?.data?.message ?? "Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-orange-500" size={20} />
            <h2 className="text-lg font-bold text-white">Report {targetType.charAt(0) + targetType.slice(1).toLowerCase()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <FiAlertTriangle className="text-green-500" size={24} />
            </div>
            <p className="text-white font-semibold">Report submitted</p>
            <p className="text-zinc-400 text-sm">
              {targetLabel ? `"${targetLabel}"` : "This content"} has been flagged for review. Our moderation team will look into it.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {targetLabel && (
              <p className="text-zinc-400 text-sm truncate">
                Reporting: <span className="text-white font-medium">{targetLabel}</span>
              </p>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-2">
                Reason *
              </label>
              <div className="space-y-2">
                {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      reason === value
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm text-zinc-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-2">
                Additional details (optional)
              </label>
              <textarea
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Describe the issue..."
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
