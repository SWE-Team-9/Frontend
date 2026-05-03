"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePlayerStore,
  type Track as PlayerTrack,
} from "@/src/store/playerStore";
import {
  FaMusic,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaPlay,
} from "react-icons/fa";
import { buildTrackPermalink } from "@/src/lib/permalinks";
import { UserProfileLink } from "@/src/components/navigation/EntityLinks";

interface Track {
  trackId: string;
  title: string;
  artist?: string;
  artistHandle?: string;
  slug?: string;
  cover?: string;
  duration?: number;
  likesCount?: number;
  repostsCount?: number;
}

interface Props {
  track: Track;
  index: number;
  total: number;
  canEdit?: boolean;
  isRemoving?: boolean;
  onRemove?: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onPlay?: (track: Track) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function TrackItem({
  track,
  index,
  total,
  canEdit = false,
  isRemoving = false,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPlay,
}: Props) {
  const playerTracks = usePlayerStore((state) => state.tracks);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const toggle = usePlayerStore((state) => state.toggle);
  const fetchAndPlay = usePlayerStore((state) => state.fetchAndPlay);

  const handlePlay = async () => {
    if (onPlay) {
      onPlay(track);
      return;
    }

    if (currentTrack?.trackId === track.trackId) {
      await toggle();
      return;
    }

    const matched = playerTracks.find((t) => t.trackId === track.trackId);
    const fallbackTrack: PlayerTrack = {
      trackId: track.trackId,
      title: track.title,
      artist: track.artist ?? "Unknown Artist",
      artistId: "",
      cover: track.cover ?? "/images/track-placeholder.png",
      duration: track.duration,
    };

    await fetchAndPlay(matched ?? fallbackTrack);
  };

  const trackHref = buildTrackPermalink({
    trackId: track.trackId,
    artistHandle: track.artistHandle,
    slug: track.slug,
  });

  return (
    <div className="group flex items-center gap-4 px-3 py-2 rounded hover:bg-zinc-800/50 transition-colors">
      <span className="w-6 text-right text-zinc-500 text-xs">{index + 1}</span>

      <button
        onClick={handlePlay}
        className="relative w-10 h-10 rounded overflow-hidden bg-[#222] shrink-0"
      >
        {track.cover ? (
          <Image
            src={track.cover}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaMusic className="text-zinc-600 text-sm" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FaPlay className="text-white text-xs" />
        </div>
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-1 truncate">
        {track.artist && (
          <UserProfileLink
            handle={track.artistHandle}
            className="shrink-0 text-md font-bold text-zinc-500 hover:text-white transition-colors"
          >
            {track.artist}
          </UserProfileLink>
        )}
        {track.artist && (
          <span className="shrink-0 text-zinc-500 font-bold">.</span>
        )}
        <Link
          href={trackHref}
          className="truncate text-md font-bold text-white transition duration-200 hover:text-neutral-600"
        >
          {track.title}
        </Link>
      </div>

      <span className="text-xs text-zinc-500">
        {formatDuration(track.duration)}
      </span>

      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={index === 0}
            className="w-7 h-7 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <FaArrowUp size={10} />
          </button>

          <button
            onClick={() => onMoveDown?.(index)}
            disabled={index === total - 1}
            className="w-7 h-7 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <FaArrowDown size={10} />
          </button>

          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="w-7 h-7 rounded text-red-400 hover:text-red-300 hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={isRemoving ? "Removing..." : "Remove track"}
          >
            <FaTimes size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
