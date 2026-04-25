"use client";

import Image from "next/image";
import type { SharedTrack } from "@/src/types/messages";

const FALLBACK = "/images/track-placeholder.png";

export default function SharedTrackCard({ track }: { track: SharedTrack }) {
  return (
    <div className="mt-3 flex max-w-xl gap-3 rounded bg-zinc-900 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
        <Image
          src={track.coverArtUrl || FALLBACK}
          alt={track.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-zinc-400">
          {track.artist.display_name}
        </p>
        <p className="truncate text-sm font-bold text-white">{track.title}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {(track.playCount ?? 0).toLocaleString()} plays ·{" "}
          {(track.likesCount ?? 0).toLocaleString()} likes
        </p>
      </div>
    </div>
  );
}