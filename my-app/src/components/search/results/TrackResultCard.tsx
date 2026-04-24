import Link from "next/link";
import type { SearchTrack } from "@/src/types/search";

interface Props {
  track: SearchTrack;
}

export default function TrackResultCard({ track }: Props) {
  return (
    <Link
      href={`/tracks/${track.id}`}
      className="flex gap-3 rounded p-2"
    >
      <div className="h-14 w-14 rounded bg-gray-200">
        {track.artwork_url && (
          <img
            src={track.artwork_url}
            alt={track.title}
            className="h-full w-full rounded object-cover"
          />
        )}
      </div>
      <div>
        <div className="font-bold">{track.title}</div>
        <div className="text-md text-gray-500 font-bold">{track.genre}</div>
      </div>
    </Link>
  );
}