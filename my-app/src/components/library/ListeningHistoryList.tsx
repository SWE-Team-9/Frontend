"use client";

import { ListeningHistoryItem } from "@/src/types/history";
import HistoryTrackRow from "./HistoryTrackRow";

interface ListeningHistoryListProps {
  tracks: ListeningHistoryItem[];
}

export default function ListeningHistoryList({
  tracks,
}: ListeningHistoryListProps) {
  return (
    <section className="mb-20">
      <h2 className="mb-8 text-[18px] font-bold text-white">
        Hear the tracks you&apos;ve played:
      </h2>

      <div>
        {tracks.map((track) => (
          <HistoryTrackRow key={`${track.trackId}-${track.playedAt}`} track={track} />
        ))}
      </div>
    </section>
  );
}