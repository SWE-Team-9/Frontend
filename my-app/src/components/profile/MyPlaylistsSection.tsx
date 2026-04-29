"use client";

import { usePlaylists } from "@/src/hooks/usePlaylists";
import { ProfilePlaylistCard } from "@/src/components/profile/ProfilePlaylistCard";

export function MyPlaylistsSection() {
  const { playlists, isLoading, error } = usePlaylists();

  if (isLoading) {
    return (
      <section className="px-8 py-8">
        <p className="text-zinc-500">Loading playlists...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-8 py-8">
        <p className="text-red-400">Failed to load playlists.</p>
      </section>
    );
  }

  return (
    <section className="px-8 py-8 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
          My Playlists
        </h2>

        <span className="text-xs text-zinc-500">
          {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {playlists.map((playlist) => (
          <ProfilePlaylistCard
            key={playlist.playlistId}
            playlist={playlist}
          />
        ))}
      </div>
    </section>
  );
}