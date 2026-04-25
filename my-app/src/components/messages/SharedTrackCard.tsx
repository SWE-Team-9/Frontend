"use client";

import Image from "next/image";
import { Play, Upload, Repeat2, Link2, MoreHorizontal } from "lucide-react";
import type { SharedTrack } from "@/src/types/messages";

const FALLBACK = "/images/track-placeholder.png";

function formatCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatDuration(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function MockWaveform({ duration }: { duration?: number }) {
  const bars = Array.from({ length: 120 }, (_, i) => {
    const h = 12 + Math.abs(Math.sin(i * 0.55)) * 34 + (i % 7) * 2;
    return h;
  });

  return (
    <div className="relative mt-3 flex h-14 items-center gap-[2px]">
      {bars.map((height, i) => (
        <span
          key={i}
          className="w-[2px] bg-zinc-300"
          style={{ height: `${height}px` }}
        />
      ))}

      <span className="absolute bottom-0 right-0 rounded bg-black px-1 text-[10px] text-white">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

export default function SharedTrackCard({ track }: { track: SharedTrack }) {
  return (
    <div className="mt-3 max-w-[620px] text-white">
      <div className="flex gap-4">
        <div className="relative h-36 w-36 shrink-0 overflow-hidden bg-zinc-800">
          <Image
            src={track.coverArtUrl || FALLBACK}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <button className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Play className="ml-0.5 h-5 w-5 fill-black" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-400">
                {track.artist.display_name}
              </p>
              <p className="truncate text-base font-bold text-white">
                {track.title}
              </p>
            </div>
          </div>

          <MockWaveform duration={track.durationSeconds} />

          <div className="mt-3 flex items-center gap-2">
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Upload className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Repeat2 className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Link2 className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <div className="ml-auto flex items-center gap-4 text-xs text-zinc-400">
              <span>▶ {formatCount(track.playCount)}</span>
              <span>♥ {formatCount(track.likesCount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}