import Image from "next/image";
import Link from "next/link";
import type { SearchTrack } from "@/src/types/search";

interface Props {
  track: SearchTrack;
}

export default function TrackResultCard({ track }: Props) {
  return (
    <Link
      href={`/tracks/${track.id}`}
      className="flex gap-4 rounded-lg p-3 hover:bg-neutral-800 transition-colors"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-700">
        {track.artwork_url && (
          <Image
            src={track.artwork_url}
            alt={track.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-col justify-center gap-1">
        <div className="text-base font-bold text-white">{track.title}</div>
        {track.genre && (
          <div className="text-sm text-neutral-400 font-medium">{track.genre}</div>
        )}
        {track.artist_handle && (
          <div className="text-sm text-neutral-500">@{track.artist_handle}</div>
        )}
      </div>
    </Link>
  );
}