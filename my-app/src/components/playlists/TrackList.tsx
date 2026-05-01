"use client";

import { TrackCard, IntegratedTrack } from "@/src/components/tracks/TrackCard";
import { FaChevronUp, FaChevronDown, FaTimes } from "react-icons/fa";
export interface PlaylistTrack extends IntegratedTrack {
  cover?: string; 
}

// Props for TrackList component
interface Props {
  tracks: PlaylistTrack[];
  contextTrackIds?: string[];
  canEdit?: boolean;
  onRemove?: (trackId: string) => void;
  onReorder?: (orderedTrackIds: string[]) => void;
}

export function TrackList({
  tracks,
  contextTrackIds,
  canEdit = false,
  onRemove,
  onReorder,
}: Props) {
  const move = (from: number, to: number) => {
    // Prevent invalid index moves
    if (to < 0 || to >= tracks.length) return;

    // Create a copy of tracks array
    const next = [...tracks];

    // Remove item from original position
    const [item] = next.splice(from, 1);

    // Insert item at new position
    next.splice(to, 0, item);

    // Emit reordered track IDs to parent
    onReorder?.(next.map((t) => t.trackId));
  };

  // Empty state when no tracks exist
  if (tracks.length === 0) {
    return (
      <p className="text-center text-zinc-500 text-sm py-12">
        No tracks in this playlist yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, i) => (
        <div key={track.trackId} className="flex items-start gap-2 group/row">
          {/* Track number */}
          <span className="w-5 pt-6 text-right text-xs text-zinc-600 shrink-0 group-hover/row:text-zinc-400 select-none">
            {i + 1}
          </span>

          {/* TrackCard */}
          <div className="flex-1 min-w-0">
            <TrackCard
              track={{
                ...track,
                // normalizePlaylist maps cover → coverArtUrl for TrackCard
                coverArtUrl: track.coverArtUrl ?? track.cover,
              }}
              contextTrackIds={contextTrackIds}
            />
          </div>

          {/* Edit controls — only visible when canEdit is true */}
          {canEdit && (
            <div className="flex flex-col items-center gap-1 pt-4 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="text-zinc-500 hover:text-white disabled:opacity-20 p-1"
                aria-label="Move up"
              >
                <FaChevronUp size={10} />
              </button>

              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === tracks.length - 1}
                className="text-zinc-500 hover:text-white disabled:opacity-20 p-1"
                aria-label="Move down"
              >
                <FaChevronDown size={10} />
              </button>

              <button
                type="button"
                onClick={() => onRemove?.(track.trackId)}
                className="text-zinc-600 hover:text-red-400 p-1"
                aria-label="Remove from playlist"
              >
                <FaTimes size={10} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
