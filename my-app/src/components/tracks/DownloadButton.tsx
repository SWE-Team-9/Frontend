"use client";

import React, { useState, useEffect } from "react";
import { LuDownload, LuLock, LuLoader, LuCheck } from "react-icons/lu";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  getOfflineTrack,
  DownloadForbiddenError,
} from "@/src/services/subscriptionService";
import {
  saveOfflineTrack,
  isTrackCached,
  removeOfflineTrack,
} from "@/src/services/offlineAudioCache";
import Link from "next/link";

interface DownloadButtonProps {
  trackId: string;
  trackTitle?: string;
  /** If false, the track owner disabled downloading — hide button entirely */
  downloadable?: boolean;
  size?: "compact" | "full";
}

type DownloadState = "idle" | "loading" | "cached" | "forbidden" | "error";

export function DownloadButton({
  trackId,
  trackTitle = "track",
  downloadable = true,
  size = "full",
}: DownloadButtonProps) {
  const [dlState, setDlState] = useState<DownloadState>("idle");
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const buttonTitle = trackTitle.trim() || "track";

  // Read subscription from global store (synced by NavBar on mount)
  const sub = useSubscriptionStore((state) => state.sub);
  const isPremium =
    sub?.subscriptionType === "PRO" || sub?.subscriptionType === "GO+";

  // Check on mount whether this track is already cached offline
  useEffect(() => {
    if (!isPremium) return;
    isTrackCached(trackId)
      .then((cached) => { if (cached) setDlState("cached"); })
      .catch(() => undefined);
  }, [trackId, isPremium]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // ── Toggle off: already cached → remove ──────────────────────
    if (dlState === "cached") {
      await removeOfflineTrack(trackId).catch(() => undefined);
      setDlState("idle");
      return;
    }

    // ── CLIENT-SIDE GUARD ─────────────────────────────────────────
    if (!isPremium) {
      setDlState("forbidden");
      setShowUpgradeHint(true);
      return;
    }

    setDlState("loading");
    setShowUpgradeHint(false);

    try {
      // 1. Ask backend for a presigned S3 URL (no file write happens here)
      const result = await getOfflineTrack(trackId);

      // 2. Fetch audio bytes through the NestJS stream proxy (server fetches
      //    from S3, so no browser-side CORS issue). Bytes are stored in IndexedDB
      //    for offline playback — never written to the device file system.
      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/offline/${result.trackId}/stream`;
      await saveOfflineTrack(
        {
          trackId: result.trackId,
          title: result.title,
          artist: result.artist ?? null,
          coverArtUrl: result.coverArtUrl ?? null,
          durationMs: result.durationMs ?? null,
          expiresInSeconds: result.expiresInSeconds ?? 900,
        },
        streamUrl,
      );

      setDlState("cached");
    } catch (err) {
      console.error("Offline save error:", err);

      if (err instanceof DownloadForbiddenError) {
        setDlState("forbidden");
        setShowUpgradeHint(true);
      } else {
        setDlState("error");
        setTimeout(() => setDlState("idle"), 3000);
      }
    }
  };

  // ── Styles ─────────────────────────────────────────────────────
  const isCompact = size === "compact";
  const isForbidden = dlState === "forbidden";
  const isLoading = dlState === "loading";
  const isError = dlState === "error";
  const isCached = dlState === "cached";

  if (!downloadable) {
    return null;
  }

  const buttonClass = `
    group flex items-center gap-1.5 h-7.5 px-2.5 rounded border
    transition-all duration-150 select-none cursor-pointer
    ${
      isForbidden
        ? "border-amber-600/60 bg-amber-950/30 text-amber-400 hover:border-amber-500"
        : isError
          ? "border-red-700 text-red-400"
          : isCached
            ? "border-green-700/60 bg-green-950/30 text-green-400 hover:border-red-600/60 hover:text-red-400"
            : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"
    }
  `;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isCached ? "Remove offline download" : "Download for offline"}
        title={
          isCached
            ? `${buttonTitle} downloaded for offline. Click to remove.`
            : `Download ${buttonTitle} for offline listening`
        }
        className={buttonClass}
      >
        {/* Icon */}
        <span className="flex items-center transition-transform duration-100 group-active:scale-90">
          {isLoading ? (
            <LuLoader size={14} className="animate-spin" />
          ) : isForbidden ? (
            <LuLock size={14} className="text-amber-400" />
          ) : isCached ? (
            <LuCheck size={14} className="text-green-400" />
          ) : (
            <LuDownload size={14} />
          )}
        </span>

        {/* Label — only in full mode */}
        {!isCompact && (
          <span className="text-[11px] font-medium">
            {isLoading
              ? "Saving..."
              : isForbidden
                ? "PRO only"
                : isError
                  ? "Failed"
                  : isCached
                    ? "Saved ✓"
                    : "Offline download"}
          </span>
        )}
      </button>

      {/* ── Upgrade tooltip ──────────────────────────────────────── */}
      {showUpgradeHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-50">
          <div className="bg-zinc-900 border border-amber-600/40 rounded-lg p-3 shadow-xl text-center">
            <p className="text-amber-400 font-bold text-xs mb-1">
              🔒 Premium Feature
            </p>
            <p className="text-zinc-400 text-[11px] mb-2 leading-tight">
              Save tracks for offline listening — available for Artist Pro members only.
            </p>
            <Link
              href="/subscriptions"
              onClick={(e) => e.stopPropagation()}
              className="block w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-wide rounded transition-colors"
            >
              Upgrade to Pro
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUpgradeHint(false);
                setDlState("idle");
              }}
              className="mt-1.5 text-zinc-600 hover:text-zinc-400 text-[10px]"
            >
              Dismiss
            </button>
          </div>
          {/* Tooltip arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-zinc-900 border-r border-b border-amber-600/40 rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
