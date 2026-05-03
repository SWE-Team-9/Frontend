"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/src/services/admin/adminServiceFactory";
import { useAdminStore } from "@/src/store/useAdminStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import {
  FiArrowLeft,
  FiMusic,
  FiEyeOff,
  FiTrash2,
  FiShield,
  FiUser,
  FiRotateCcw,
  FiInfo,
} from "react-icons/fi";
import Link from "next/link";
import { ReportActions } from "@/src/components/admin/ReportActions";
import { OffenderCard } from "@/src/components/admin/OffenderCard";
import { Report, AdminUser } from "@/src/types/admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ReportDetailsPage({ params }: PageProps) {
  const { id } = React.use(params);

  const { user: authUser } = useAuthStore();
  const { moderateTrack, moderateComment, fetchUserById } =
    useAdminStore();

  const [report, setReport] = useState<Report | null>(null);
  const [, setUser] = useState<AdminUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // LOAD REPORT + USERS
  // =========================
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const reportData = await adminService.getReportById(id);

        if (cancelled) return;

        if (!reportData) {
          setError("Report not found.");
          setLoading(false);
          return;
        }

        const validatedReport = reportData as Report;
        setReport(validatedReport);

        const userIds: string[] = [];

        if (validatedReport.reporter?.id) {
          userIds.push(validatedReport.reporter.id);
        }

        if (validatedReport.offender?.id) {
          userIds.push(validatedReport.offender.id);
        }

        if (
          validatedReport.target?.type === "USER" &&
          validatedReport.target?.id
        ) {
          userIds.push(validatedReport.target.id);
        }

        for (const userId of userIds) {
          await fetchUserById(userId);
        }

        setUser(null);
        setError(null);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load report details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, fetchUserById]);

  // =========================
  // MODERATION ACTIONS
  // =========================
  const handleTrackModeration = async (
    action: "HIDDEN" | "REMOVED" | "VISIBLE"
  ) => {
    if (!report?.target?.id) return;

    try {
      await moderateTrack(report.target.id, {
        action,
        reason: `Admin action: ${action} by ${authUser?.displayName}`,
        reportId: report.id,
      });
    } catch (err) {
      console.error("Track moderation failed:", err);
    }
  };

  const handleCommentModeration = async (isHidden: boolean) => {
    if (!report?.target?.id) return;

    try {
      await moderateComment(report.target.id, {
        isHidden,
        reportId: report.id,
        reason: `Admin action: ${
          isHidden ? "HIDDEN" : "RESTORED"
        } by ${authUser?.displayName}`,
      });
    } catch (err) {
      console.error("Comment moderation failed:", err);
    }
  };

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 animate-pulse font-mono uppercase tracking-widest">
        Loading Report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-red-500 font-bold">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Report not found.
      </div>
    );
  }

  // =========================
  // HELPERS
  // =========================
  const isTrack = report.target?.type === "TRACK";
  const isComment = report.target?.type === "COMMENT";

  // =========================
  // UI
  // =========================
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold text-sm"
        >
          <FiArrowLeft /> Back
        </Link>

        <span className="px-4 py-1 bg-zinc-800 text-[10px] text-zinc-400 rounded-full font-mono border border-zinc-700">
          REF: {report.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN */}
        <div className="lg:col-span-2 space-y-6">
          {/* REPORT CARD */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative">
            <div className="absolute top-4 right-4">
              <ReportActions reportId={report.id} />
            </div>

            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
              {report.category}
            </p>

            <h1 className="text-3xl font-bold mt-4 mb-6">
              {report.description}
            </h1>

            <div className="flex items-center gap-6 border-t border-zinc-800 pt-6">
              <div className="flex items-center gap-2">
                <FiUser className="text-orange-500" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase">
                    Reporter
                  </p>
                  <p className="text-sm font-bold">
                    {report.reporter?.display_name}
                  </p>
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                {new Date(report.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* TRACK ACTIONS */}
          {authUser?.systemRole === "ADMIN" && isTrack && (
            <div className="bg-zinc-900 border border-blue-500/20 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-6">
                <FiShield className="text-blue-400" />
                <h3 className="font-bold uppercase text-sm">
                  Admin Actions
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleTrackModeration("VISIBLE")}
                  className="bg-green-500/10 text-green-500 p-4 rounded-xl"
                >
                  <FiRotateCcw /> Restore
                </button>

                <button
                  onClick={() => handleTrackModeration("HIDDEN")}
                  className="bg-zinc-800 p-4 rounded-xl"
                >
                  <FiEyeOff /> Hide
                </button>

                <button
                  onClick={() => handleTrackModeration("REMOVED")}
                  className="bg-red-500/10 text-red-500 p-4 rounded-xl"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          )}

          {/* COMMENT ACTIONS */}
          {authUser?.systemRole === "ADMIN" && isComment && (
            <div className="bg-zinc-900 border border-blue-500/20 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-6">
                <FiShield className="text-blue-400" />
                <h3 className="font-bold uppercase text-sm">
                  Comment Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCommentModeration(false)}
                  className="bg-green-500/10 text-green-500 p-4 rounded-xl"
                >
                  <FiRotateCcw /> Restore
                </button>

                <button
                  onClick={() => handleCommentModeration(true)}
                  className="bg-zinc-800 p-4 rounded-xl"
                >
                  <FiEyeOff /> Hide
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <OffenderCard report={report} />

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <p className="text-xs text-zinc-500 mb-4">Target</p>

            <div className="flex items-center gap-3">
              <FiMusic className="text-orange-500" />
              <div>
                <p className="font-bold">{report.target.title}</p>
                <p className="text-xs text-zinc-500">
                  {report.target.type} • {report.target.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}