"use client";

// Next.js optimized image component
import Image from "next/image";

// Icons used in track UI (play, controls, remove, etc.)
import { FaMusic, FaTimes, FaArrowUp, FaArrowDown, FaPlay } from "react-icons/fa";

// Track data structure
interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
}

// Props for TrackItem component
interface Props {
  track: Track;
  index: number;
  total: number;
  canEdit?: boolean;
  onRemove?: (trackId: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onPlay?: (track: Track) => void;
}

// Utility function to format seconds into mm:ss
function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${m}:${s}`;
}

// Main track item component
export function TrackItem({
  track,
  index,
  total,
  canEdit = false,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPlay,
}: Props) {
  return (
    <div className="group flex items-center gap-4 px-3 py-2 rounded hover:bg-zinc-800/50 transition-colors">
      
      {/* Track index number */}
      <span className="w-6 text-right text-zinc-500 text-xs">
        {index + 1}
      </span>

      {/* Track thumbnail + play button */}
      <button
        onClick={() => onPlay?.(track)}
        className="relative w-10 h-10 rounded overflow-hidden bg-[#222] flex-shrink-0"
      >
        {/* Cover image or fallback icon */}
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

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FaPlay className="text-white text-xs" />
        </div>
      </button>

      {/* Track title + artist */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{track.title}</p>

        {track.artist && (
          <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
        )}
      </div>

      {/* Track duration */}
      <span className="text-xs text-zinc-500">
        {formatDuration(track.duration)}
      </span>

      {/* Edit controls (only for playlist owner/editor) */}
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          
          {/* Move track up */}
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={index === 0}
            className="w-7 h-7 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <FaArrowUp size={10} />
          </button>

          {/* Move track down */}
          <button
            onClick={() => onMoveDown?.(index)}
            disabled={index === total - 1}
            className="w-7 h-7 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <FaArrowDown size={10} />
          </button>

          {/* Remove track from playlist */}
          <button
            onClick={() => onRemove?.(track.trackId)}
            className="w-7 h-7 rounded text-red-400 hover:text-red-300 hover:bg-zinc-800 flex items-center justify-center"
            aria-label="Remove track"
          >
            <FaTimes size={11} />
          </button>
        </div>
      )}
    </div>
  );
}