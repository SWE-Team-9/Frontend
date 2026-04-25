"use client";

import { useMemo, useState } from "react";
import { usePlaylists } from "@/src/hooks/usePlaylists";
import { PlaylistCard } from "@/src/components/playlists/PlaylistCard";
import { CreatePlaylistModal } from "@/src/components/playlists/CreatePlaylistModal";
import { FaPlus } from "react-icons/fa";
import {
  LibraryPlaylistsHeader,
  PlaylistFilterMode,
} from "@/src/components/library/LibraryPlaylistsHeader";

export default function LibraryPlaylistsPage() {
  const { playlists, isLoading, createPlaylist } = usePlaylists();

  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<PlaylistFilterMode>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const visible = useMemo(() => {
    let list = playlists ?? [];

    if (mode === "created") list = list.filter((p) => !p.liked);
    if (mode === "liked") list = list.filter((p) => p.liked);

    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [playlists, mode, filter]);

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">

      {/* HEADER FILTER */}
      <LibraryPlaylistsHeader
        filter={filter}
        onFilterChange={setFilter}
        mode={mode}
        onModeChange={setMode}
      />

      {/* LOADING */}
      {isLoading && (
        <p className="text-center text-zinc-500 py-20">Loading...</p>
      )}

      {/* EMPTY STATE */}
      {!isLoading && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            You have no playlists yet
          </h2>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-100 text-black text-xs font-bold uppercase tracking-wider rounded transition-colors"
          >
            <FaPlus size={11} /> Create Playlist
          </button>
        </div>
      )}

      {/* LIST */}
      {!isLoading && playlists.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Your Playlists</h1>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              <FaPlus size={11} /> Create Playlist
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {visible.map((playlist) => (
              <PlaylistCard
                key={playlist.playlistId}
                playlist={playlist}
              />
            ))}
          </div>
        </>
      )}

      {/* MODAL  */}
      <CreatePlaylistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createPlaylist}
      />
    </div>
  );
}