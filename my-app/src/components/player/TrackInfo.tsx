"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";
import Image from "next/image";

export function TrackInfo() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const accessState = usePlayerStore((s) => s.accessState);
  const [liked, setLiked] = useState(false);

  if (!currentTrack) return null;

  const getArtistLabel = (value: unknown): string => {
    if (typeof value === "string") return value;

    if (
      value &&
      typeof value === "object" &&
      "displayName" in value &&
      typeof (value as { displayName?: unknown }).displayName === "string"
    ) {
      return (value as { displayName: string }).displayName;
    }

    return "Unknown Artist";
  };

  const artistLabel = getArtistLabel(currentTrack.artist);

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
      <Image
        src={currentTrack.cover}
        alt={currentTrack.title}
        width={48}
        height={48}
        className="rounded object-cover shadow-lg shrink-0"
        unoptimized
      />
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate leading-tight">
          {currentTrack.title}
        </p>
        <p className="text-[#999] text-xs truncate mt-0.5">
          {artistLabel}
        </p>

        {accessState === "PREVIEW" && (
          <span className="text-[10px] text-[#f50] font-bold uppercase">
            Preview
          </span>
        )}
      </div>

      <button
        onClick={() => setLiked((l) => !l)}
        className={`shrink-0 p-1.5 transition-colors ${liked ? "text-[#f50]" : "text-[#999] hover:text-white"
          }`}
      >
        {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
      </button>
    </div>
  );
}