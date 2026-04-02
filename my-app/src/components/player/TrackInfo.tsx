"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";

export function TrackInfo() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const [liked, setLiked] = useState(false);

  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
      <img
        src={currentTrack.cover}
        alt={currentTrack.title}
        className="w-12 h-12 rounded object-cover shadow-lg flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate leading-tight">
          {currentTrack.title}
        </p>
        <p className="text-[#999] text-xs truncate mt-0.5">{currentTrack.artist}</p>
        {/* FIX 4: preview badge */}
        {currentTrack.accessState === "PREVIEW" && (
          <span className="text-[10px] text-[#f50] font-bold uppercase">Preview</span>
        )}
      </div>
      <button
        onClick={() => setLiked((l) => !l)}
        className={`flex-shrink-0 p-1.5 transition-colors ${liked ? "text-[#f50]" : "text-[#999] hover:text-white"}`}
      >
        {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
      </button>
    </div>
  );
}