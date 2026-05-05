import Image from "next/image";
import Link from "next/link";
import type { SearchPlaylist } from "@/src/types/search";
import { buildPlaylistPermalink } from "@/src/lib/permalinks";

interface Props {
  playlist: SearchPlaylist;
}

export default function PlaylistResultCard({ playlist }: Props) {
  return (
    <Link
      href={buildPlaylistPermalink({ playlistId: playlist.id })}
      className="flex gap-4 rounded-lg p-3 hover:bg-neutral-800 transition-colors"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-700">
        {playlist.cover_url && (
          <Image
            src={playlist.cover_url}
            alt={playlist.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-col justify-center gap-1">
        <div className="text-base font-bold text-white">{playlist.title}</div>
        <div className="text-sm text-neutral-400">Playlist</div>
      </div>
    </Link>
  );
}