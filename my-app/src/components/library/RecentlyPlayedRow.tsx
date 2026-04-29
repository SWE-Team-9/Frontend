"use client";

import { RecentlyPlayedItem } from "@/src/types/history";
import RecentlyPlayedCard from "@/src/components/discover/RecentlyPlayedCard";

interface RecentlyPlayedRowProps {
  title?: string;
  tracks: RecentlyPlayedItem[];
}

export default function RecentlyPlayedRow({
  title = "Recently played",
  tracks,
}: RecentlyPlayedRowProps) {
  return (
    <section className="mb-14">
      <h2 className="mb-6 text-[18px] font-bold text-white">{title}</h2>

      <div className="flex gap-6 overflow-x-auto overflow-y-visible pb-16">
        {tracks.map((track) => (
          <RecentlyPlayedCard key={track.trackId} track={track} />
        ))}
      </div>
    </section>
  );
}