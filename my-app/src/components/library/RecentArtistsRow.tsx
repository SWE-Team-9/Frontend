"use client";

import RecentArtistCard, { RecentArtistItem } from "./RecentArtistCard";

interface RecentArtistsRowProps {
  title?: string;
  artists: RecentArtistItem[];
}

export default function RecentArtistsRow({
  title = "Recently played:",
  artists,
}: RecentArtistsRowProps) {
  if (!artists.length) return null;

  return (
    <section className="mb-14">
      <h2 className="mb-6 text-[18px] font-bold text-white">{title}</h2>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {artists.map((artist) => (
          <RecentArtistCard key={artist.artistId} artist={artist} />
        ))}
      </div>
    </section>
  );
}
