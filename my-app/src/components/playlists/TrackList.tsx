"use client";

import { TrackItem } from "./TrackItem";

interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
}

interface Props {
  tracks: Track[];
  canEdit?: boolean;
  onRemove?: (trackId: string) => void;
  onReorder?: (orderedTrackIds: string[]) => void;
}

export function TrackList({ tracks, canEdit = false, onRemove, onReorder }: Props) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= tracks.length) return;
    const next = [...tracks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder?.(next.map((t) => t.trackId));
  };

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