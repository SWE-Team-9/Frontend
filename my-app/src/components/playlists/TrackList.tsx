"use client";

import { useState } from "react";
import { TrackItem } from "@/src/components/playlists/TrackItem";

interface Track {
  trackId: string;
  title: string;
  artist?: string;
  artistHandle?: string;
  cover?: string;
  duration?: number;
  likesCount?: number;
  repostsCount?: number;
}

interface Props {
  tracks: Track[];
  playlistId?: string;
  canEdit?: boolean;
  onRemove?: (trackId: string) => Promise<void>;
  onReorder?: (orderedTrackIds: string[]) => Promise<void>;
}

export function TrackList({
  tracks,
  playlistId,
  canEdit = false,
  onRemove,
  onReorder,
}: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (trackId: string) => {
    if (!onRemove || removingId) return;
    setRemovingId(trackId);
    try {
      await onRemove(trackId);
    } finally {
      setRemovingId(null);
    }
  };

  const move = async (from: number, to: number) => {
    if (!onReorder) return;
    if (to < 0 || to >= tracks.length) return;

    const next = [...tracks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    await onReorder(next.map((t) => t.trackId));
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
          playlistId={playlistId}
          canEdit={canEdit}
          isRemoving={removingId === track.trackId}
          onRemove={onRemove ? () => handleRemove(track.trackId) : undefined}
          onMoveUp={(idx) => move(idx, idx - 1)}
          onMoveDown={(idx) => move(idx, idx + 1)}
        />
      ))}
    </div>
  );
}