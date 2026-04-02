"use client";

import { usePlayerStore } from "@/src/store/playerStore";

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressBar() {
  // currentTime and duration now come from audio element events via the store
  // duration has its own store field with a 0 fallback — no more currentTrack?.duration
  const { currentTime, duration, setCurrentTime } = usePlayerStore();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.max(0, Math.min(1, ratio)) * duration);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[#999] text-xs tabular-nums w-8 text-right flex-shrink-0">
        {formatTime(currentTime)}
      </span>
      <div
        className="flex-1 h-1 bg-[#333] rounded-full relative cursor-pointer group"
        onClick={handleClick}
      >
        <div
          className="h-full bg-[#f50] rounded-full relative transition-all"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <span className="text-[#999] text-xs tabular-nums w-8 flex-shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}