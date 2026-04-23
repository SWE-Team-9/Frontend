import Link from "next/link";
import type { SearchPlaylist } from "@/src/types/search";

interface Props {
  playlist: SearchPlaylist;
}

export default function PlaylistResultCard({ playlist }: Props) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="flex gap-3 rounded p-2 hover:bg-gray-50"
    >
      <div className="h-14 w-14 overflow-hidden rounded bg-gray-200">
        {playlist.cover_url && (
          <img
            src={playlist.cover_url}
            alt={playlist.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="font-medium">{playlist.title}</div>
    </Link>
  );
}