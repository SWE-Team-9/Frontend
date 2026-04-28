"use client";

// Component responsible for rendering a list of tracks inside a playlist
import { TrackItem } from "./TrackItem";

// Track data structure definition
interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
}

// Props for TrackList component
interface Props {
  tracks: Track[];
  canEdit?: boolean;
  onRemove?: (trackId: string) => void;
  onReorder?: (orderedTrackIds: string[]) => void;
}

// Main TrackList component
export function TrackList({ tracks, canEdit = false, onRemove, onReorder }: Props) {
 
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
        No tracks in this playlist yet
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-900">
      {tracks.map((track, i) => (
        <TrackItem
          key={track.trackId}
          track={track}
          index={i}
          total={tracks.length}
          canEdit={canEdit}
          onRemove={onRemove}
          onMoveUp={(idx) => move(idx, idx - 1)}
          onMoveDown={(idx) => move(idx, idx + 1)}
        />
      ))}
    </div>
  );
}