"use client";

import { usePlayerStore } from "@/src/store/playerStore";

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressBar() {
  const {
    currentTime,
    duration,
    seekTo,
    accessState,
    isProcessing,
    isResolvingPlayback,
    isPlayingAd,
    currentAd,
    adElapsedSeconds,
  } = usePlayerStore();

  // For text-only ads, drive progress from the elapsed-seconds counter.
  // For audio ads the real audio element feeds currentTime/duration normally.
  const adIsTextOnly = isPlayingAd && currentAd && !currentAd.audioUrl;
  const displayTime = adIsTextOnly ? adElapsedSeconds : currentTime;
  const displayDuration = adIsTextOnly ? currentAd.durationSeconds : duration;
  const progress = displayDuration > 0 ? Math.min(100, (displayTime / displayDuration) * 100) : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlayingAd) return; // cannot seek during an ad
    if (accessState === "BLOCKED" || isProcessing || isResolvingPlayback) return;
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(Math.max(0, Math.min(1, ratio)) * duration);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[#999] text-xs tabular-nums w-8 text-right shrink-0">
        {formatTime(displayTime)}
      </span>
      <div
        className={`flex-1 h-1 bg-[#8c8c8c] rounded-full relative group ${isPlayingAd ? "cursor-default" : "cursor-pointer"}`}
        onClick={handleClick}
      >
        <div
          className={`h-full rounded-full relative transition-all ${isPlayingAd ? "bg-[#ff5500]" : "bg-[#f50]"}`}
          style={{ width: `${progress}%` }}
        >
          {!isPlayingAd && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <span className="text-[#999] text-xs tabular-nums w-8 shrink-0">
        {formatTime(displayDuration)}
      </span>
    </div>
  );
}