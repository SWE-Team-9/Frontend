"use client";

import React, { useState } from "react";
import { LuDownload, LuLock, LuLoader } from "react-icons/lu";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  getOfflineTrack,
  DownloadForbiddenError,
} from "@/src/services/subscriptionService";

interface DownloadButtonProps {
  trackId: string;
  trackTitle?: string;
  /** If false, the track owner disabled downloading — hide button entirely */
  downloadable?: boolean;
  size?: "compact" | "full";
}

type DownloadState = "idle" | "loading" | "forbidden" | "error";

export function DownloadButton({
  trackId,
  trackTitle = "track",
  downloadable = true,
  size = "full",
}: DownloadButtonProps) {
  const [dlState, setDlState] = useState<DownloadState>("idle");
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  // Read subscription from global store (synced by NavBar on mount)
  const sub = useSubscriptionStore((state) => state.sub);
  const isPremium =
    sub?.subscriptionType === "PRO" || sub?.subscriptionType === "GO+";

  // Track owner disabled downloads → render nothing
  //   if (!downloadable) return null;

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // ── CLIENT-SIDE GUARD ──────────────────────────────────────────
    // Prevents even calling the API if we already know the user is Free.
    // The real guard is on the server (403), this just saves a round-trip.
    if (!isPremium) {
      setDlState("forbidden");
      setShowUpgradeHint(true);
      return;
    }

    setDlState("loading");
    setShowUpgradeHint(false);

try {
    // Call the subscription service to fetch the secure download URL
    const result = await getOfflineTrack(trackId);
    
    // Set UI state to 'loading' while the browser prepares the file
    setDlState("loading");

    // Create a virtual anchor element to programmatically trigger the download
    const link = document.createElement("a");
    
    // Assign the retrieved secure URL to the anchor's href
    link.href = result.downloadUrl;
    
    // Force the browser to download the file instead of playing it in-browser
    link.setAttribute("download", `${result.title || trackTitle}.mp3`);
    
    // Open in a new tab/window to ensure the current Soundcloud page remains uninterrupted
    link.target = "_blank"; 
    
    // Hide the virtual element from the UI
    link.style.display = "none";
    document.body.appendChild(link);
    
    // Simulate a user click to start the download process
    link.click();
    
    // Cleanup: Remove the virtual element from the DOM once the action is triggered
    document.body.removeChild(link);

    // Revert button state back to 'idle' after a short delay for smooth UX
    setTimeout(() => setDlState("idle"), 1000);

  } catch (err) {
    // Log the error for debugging purposes
    console.error("Download Error:", err);
    
    setDlState("error"); 
    
    // Reset back to 'idle' after 3 seconds so the user can try again
    setTimeout(() => setDlState("idle"), 3000);
  }
  };

  // ── Styles ─────────────────────────────────────────────────────
  const isCompact = size === "compact";
  const isForbidden = dlState === "forbidden";
  const isLoading = dlState === "loading";
  const isError = dlState === "error";

  const buttonClass = `
    group flex items-center gap-1.5 h-7.5 px-2.5 rounded border
    transition-all duration-150 select-none cursor-pointer
    ${
      isForbidden
        ? "border-amber-600/60 bg-amber-950/30 text-amber-400 hover:border-amber-500"
        : isError
          ? "border-red-700 text-red-400"
          : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"
    }
  `;

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        aria-label="Download track"
        className={buttonClass}
      >
        {/* Icon */}
        <span className="flex items-center transition-transform duration-100 group-active:scale-90">
          {isLoading ? (
            <LuLoader size={14} className="animate-spin" />
          ) : isForbidden ? (
            <LuLock size={14} className="text-amber-400" />
          ) : (
            <LuDownload size={14} />
          )}
        </span>

        {/* Label — only in full mode */}
        {!isCompact && (
          <span className="text-[11px] font-medium">
            {isLoading
              ? "Preparing..."
              : isForbidden
                ? "PRO only"
                : isError
                  ? "Failed"
                  : "Download"}
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
              Offline listening is available for Artist Pro members only.
            </p>
            <a
              href="/subscriptions"
              onClick={(e) => e.stopPropagation()}
              className="block w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-wide rounded transition-colors"
            >
              Upgrade to Pro
            </a>
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
