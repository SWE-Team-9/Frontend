import Image from "next/image";
import Link from "next/link";
import type { SearchPlaylist } from "@/src/types/search";

interface Props {
  playlist: SearchPlaylist;
}

export default function PlaylistResultCard({ playlist }: Props) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="flex gap-3 rounded p-2"
    >
      <div className="relative h-14 w-14 overflow-hidden rounded bg-gray-200">
        {playlist.cover_url && (
          <Image
            src={playlist.cover_url}
            alt={playlist.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="font-bold">{playlist.title}</div>
    </Link>
  );
}