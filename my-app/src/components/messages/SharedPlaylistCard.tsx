"use client";

import Image from "next/image";
import {
  Play,
  Upload,
  Repeat2,
  Link2,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import type { SharedPlaylist } from "@/src/types/messages";

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

function MockWaveform() {
  const bars = Array.from({ length: 110 }, (_, i) => {
    const h = 10 + Math.abs(Math.sin(i * 0.48)) * 32 + (i % 5) * 2;
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
    </div>
  );
}

export default function SharedPlaylistCard({
  playlist,
}: {
  playlist: SharedPlaylist;
}) {
  const firstTrack = playlist.tracksPreview?.[0];

  return (
    <div className="mt-3 max-w-[680px] text-white">
      <div className="flex gap-5">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden bg-zinc-800">
          <Image
            src={playlist.coverArtUrl || firstTrack?.coverArtUrl || FALLBACK}
            alt={playlist.title}
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
                {playlist.owner.display_name}
              </p>
              <p className="truncate text-base font-bold text-white">
                {playlist.title}
              </p>
            </div>
          </div>

          <MockWaveform />

          <div className="mt-3 space-y-2">
            {(playlist.tracksPreview ?? []).slice(0, 5).map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-2 text-sm text-zinc-300"
              >
                <span className="w-4 text-right text-zinc-500">
                  {index + 2}
                </span>

                <div className="relative h-7 w-7 shrink-0 overflow-hidden bg-zinc-800">
                  <Image
                    src={track.coverArtUrl || FALLBACK}
                    alt={track.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <span className="truncate text-zinc-400">
                  {track.artist.display_name}
                </span>

                <span className="truncate font-bold text-white">
                  · {track.title}
                </span>

                <span className="ml-auto shrink-0 text-xs text-zinc-500">
                  ▶ {formatCount(track.playCount)}
                </span>
              </div>
            ))}
          </div>

          <button className="mt-3 text-sm font-bold text-white hover:underline">
            View {playlist.tracksCount ?? 0} tracks
          </button>

          <div className="mt-4 flex items-center gap-3">
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Upload className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Repeat2 className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <Link2 className="h-4 w-4" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-[#ff5500] hover:bg-zinc-700">
              <Heart className="h-4 w-4 fill-[#ff5500]" />
            </button>
            <button className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <span className="ml-auto text-xs text-zinc-400">♥ 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}