"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import Image from "next/image";

export default function DiscoverPage() {
  const { tracks, currentTrack, isPlaying, fetchAndPlay, toggle } = usePlayerStore();

  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Discover</h1>

      <div className="space-y-3 max-w-3xl">
        {tracks.map((track) => {
          const isCurrent = currentTrack?.trackId === track.trackId;

          return (
            <div
              key={track.trackId}
              className="flex items-center gap-4 bg-[#1a1a1a] hover:bg-[#222] transition-colors rounded p-3 cursor-pointer border border-transparent hover:border-[#333]"
              onClick={() => {
                if (isCurrent) {
                  toggle();
                } else {
                  fetchAndPlay(track);
                }
              }}
            >
              <Image
                src={track.cover}
                alt={track.title}
                width={56}
                height={56}
                className="rounded object-cover"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-sm text-zinc-400 truncate">{track.artist}</p>
              </div>

              <div className="text-sm text-zinc-400">
                {isCurrent ? (isPlaying ? "Pause" : "Play") : "Play"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}