"use client";

import React, { useEffect, useState, use } from "react";
import { adminService } from "@/src/services/admin/adminService";
import { FiArrowLeft, FiUser, FiMusic, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import { ReportActions } from "@/src/components/admin/ReportActions";
import { OffenderCard } from "@/src/components/admin/OffenderCard";
import { Report, ModerationAction } from "@/src/types/admin";
interface RouteParams {
  id: string;
}

import { useAuthStore } from "@/src/store/useAuthStore";

export default function ReportDetailsPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { user } = useAuthStore(); // role-based access
  const role = user?.systemRole; // "ADMIN" | "MODERATOR"

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moderatorReview, setModeratorReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

 
  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReportById(id);

      if (!data) {
        setError("Report not found");
      } else {
        setReport(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TRACK ACTIONS (ADMIN ONLY)
  // =========================
  const handleHideTrack = async () => {
    if (!report?.target?.id) return;

    try {
      await adminService.hideTrack?.(report.target.id);
      await fetchReport();
    } catch (err) {
      console.error("Hide track failed", err);
    }
  };

  const handleRestoreTrack = async () => {
    if (!report?.target?.id) return;

    try {
      await adminService.restoreTrack?.(report.target.id);
      await fetchReport();
    } catch (err) {
      console.error("Restore track failed", err);
    }
  };

  // =========================
  // MODERATOR REVIEW SUBMIT
  // =========================
  const submitModeratorReview = async () => {
    if (!moderatorReview.trim()) return;

    try {
      setSubmittingReview(true);
      if (!report?.id) return;
      await adminService.addModeratorReview?.({
        reportId: report?.id,
        content: moderatorReview,
      });

      setModeratorReview("");
      await fetchReport();
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Loading report details...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <FiAlertCircle className="mx-auto mb-4" size={48} />
        <p>{error || "Report not found."}</p>
        <Link
          href="/admin/reports"
          className="text-orange-500 hover:underline mt-4 block"
        >
          Return to list
        </Link>
      </div>
    );
  }

  const actions = report.previous_actions_on_target ?? [];
  const moderatorReviews = report.moderator_reviews ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 text-zinc-500 hover:text-white"
        >
          <FiArrowLeft />
          Back
        </Link>

        <span className="px-3 py-1 bg-zinc-800 text-xs text-zinc-400 rounded">
          ID: {report.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* REPORT */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <h1 className="text-xl font-bold text-white mb-2">
              {report.category}
            </h1>

            <p className="text-zinc-400 italic">
              {report.description}
            </p>

            <div className="mt-4 flex justify-end">
              <ReportActions reportId={report.id} />
            </div>
          </div>

          {/* MODERATOR INPUT (ONLY MODERATOR) */}
          {role === "MODERATOR" && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-white mb-3">
                Write Moderator Review
              </h3>

              <textarea
                value={moderatorReview}
                onChange={(e) => setModeratorReview(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white"
                placeholder="Write your moderation notes..."
              />

              <button
                onClick={submitModeratorReview}
                disabled={submittingReview}
                className="mt-3 px-4 py-2 bg-orange-500 text-black font-bold rounded-xl"
              >
                Submit Review
              </button>
            </div>
          )}

          {/* ADMIN VIEW MODERATOR REVIEWS */}
          {role === "ADMIN" && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-white mb-4">
                Moderator Reviews
              </h3>

              {moderatorReviews.length > 0 ? (
                moderatorReviews.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 mb-2 bg-zinc-950 border border-zinc-800 rounded-xl"
                  >
                    <p className="text-sm text-zinc-300">{r.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-sm">No reviews yet.</p>
              )}
            </div>
          )}

          {/* HISTORY */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-zinc-500 mb-4">
              Moderation History
            </h3>

            {actions.length ? (
              actions.map((action: ModerationAction) => (
                <div
                  key={action.id}
                  className="p-3 mb-2 bg-zinc-950 border border-zinc-800 rounded-xl"
                >
                  <p className="text-orange-500 text-xs font-bold">
                    {action.action_type}
                  </p>
                  <p className="text-zinc-300 text-sm">{action.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-600 text-sm">No history.</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          <OffenderCard report={report} />

          {/* TARGET + ADMIN CONTROLS */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-xs text-zinc-500 mb-3">Target</p>

            <div className="flex items-center gap-2">
              {report.target.type === "TRACK" ? (
                <FiMusic className="text-orange-500" />
              ) : (
                <FiUser className="text-orange-500" />
              )}

              <span className="text-white font-bold">
                {report.target.title}
              </span>
            </div>

            {/* ADMIN TRACK CONTROL */}
            {role === "ADMIN" && report.target.type === "TRACK" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleHideTrack}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Hide
                </button>

                <button
                  onClick={handleRestoreTrack}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  Restore
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}