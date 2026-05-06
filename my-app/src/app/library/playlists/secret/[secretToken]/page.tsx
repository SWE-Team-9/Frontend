"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { playlistsApi } from "@/src/services/playlistsService";

export default function SecretPlaylistPage() {
  const { secretToken } = useParams<{ secretToken: string }>();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    playlistsApi
      .getSecretPlaylist(secretToken)
      .then((playlist) => {
        router.replace(`/library/playlists/${playlist.playlistId}`);
      })
      .catch(() => setError(true));
  }, [secretToken, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500">
          This link is invalid or the playlist no longer exists.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <p className="text-zinc-500 animate-pulse uppercase tracking-widest text-sm">
        Loading...
      </p>
    </div>
  );
}