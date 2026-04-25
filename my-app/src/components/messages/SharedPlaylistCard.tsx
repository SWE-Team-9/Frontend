"use client";

import Image from "next/image";
import type { SharedPlaylist } from "@/src/types/messages";

const FALLBACK = "/images/track-placeholder.png";

export default function SharedPlaylistCard({
  playlist,
}: {
  playlist: SharedPlaylist;
}) {
  return (
    <div className="mt-3 max-w-xl rounded bg-zinc-900 p-3">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
          <Image
            src={playlist.coverArtUrl || FALLBACK}
            alt={playlist.title}
            fill
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-zinc-400">
            {playlist.owner.display_name}
          </p>
          <p className="truncate text-sm font-bold text-white">
            {playlist.title}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {playlist.tracksCount ?? 0} tracks
          </p>
        </div>
      </div>

      {playlist.tracksPreview && playlist.tracksPreview.length > 0 && (
        <div className="mt-3 space-y-2">
          {playlist.tracksPreview.slice(0, 5).map((track) => (
            <p key={track.id} className="truncate text-xs text-zinc-400">
              {track.artist.display_name} - {track.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}