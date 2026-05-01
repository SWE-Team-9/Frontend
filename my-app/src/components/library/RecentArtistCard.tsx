"use client";

import Image from "next/image";
import Link from "next/link";

export interface RecentArtistItem {
  artistId: string;
  name: string;
  handle?: string;
  avatarUrl?: string | null;
  lastPlayedAt: string;
}

const FALLBACK = "/images/track-placeholder.png";

export default function RecentArtistCard({ artist }: { artist: RecentArtistItem }) {
  const href = artist.handle ? `/profiles/${artist.handle}` : "#";

  return (
    <Link href={href} className="group flex w-32 flex-shrink-0 flex-col items-center gap-2">
      <div className="relative h-32 w-32 overflow-hidden rounded-full bg-zinc-800">
        <Image
          src={artist.avatarUrl || FALLBACK}
          alt={artist.name}
          fill
          className="object-cover transition-opacity group-hover:opacity-80"
        />
      </div>
      <div className="text-center">
        <p className="line-clamp-1 text-sm font-medium text-white">{artist.name}</p>
        <p className="text-xs text-zinc-400">Artist</p>
      </div>
    </Link>
  );
}
