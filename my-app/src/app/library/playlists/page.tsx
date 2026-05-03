"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlaylists } from "@/src/hooks/usePlaylists";
import { PlaylistCard } from "@/src/components/playlists/PlaylistCard";
import { CreatePlaylistModal } from "@/src/components/playlists/CreatePlaylistModal";
import { searchService } from "@/src/services/searchService";
import type { SearchTrack } from "@/src/types/search";
import { FaPlus } from "react-icons/fa";
import {
  LibraryPlaylistsHeader,
  PlaylistFilterMode,
} from "@/src/components/library/LibraryPlaylistsHeader";
import LibraryTabs from "@/src/components/library/LibraryTabs";

export default function LibraryPlaylistsPage() {
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<PlaylistFilterMode>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [trackQuery, setTrackQuery] = useState("");
  const [searchTracks, setSearchTracks] = useState<SearchTrack[]>([]);
  const [isSearchingTracks, setIsSearchingTracks] = useState(false);

  // Pass mode to usePlaylists - when mode is "liked", it will fetch liked playlists
  const { playlists, isLoading, createPlaylist } = usePlaylists(undefined, undefined, mode);

  useEffect(() => {
    const trimmed = trackQuery.trim();
    const delay = trimmed ? 350 : 0;

    const timer = setTimeout(async () => {
      if (!trimmed) {
        setSearchTracks([]);
        return;
      }

      setIsSearchingTracks(true);
      try {
        const res = await searchService.search({ q: trimmed, type: "tracks" });
        setSearchTracks(res.data.tracks);
      } catch {
        setSearchTracks([]);
      } finally {
        setIsSearchingTracks(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [trackQuery]);

  const handleClose = () => {
    setIsCreateOpen(false);
    setTrackQuery("");
    setSearchTracks([]);
  };

  const visible = useMemo(() => {
    let list = playlists ?? [];

    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    return list;
  }, [playlists, filter]);

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <LibraryTabs />
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
            {mode === "liked" 
              ? "You haven't liked any playlists yet" 
              : "You have no playlists yet"}
          </h2>
          {mode !== "liked" && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white cursor-pointer hover:bg-zinc-100 text-black text-md font-bold uppercase tracking-wider rounded transition-colors"
            >
              <FaPlus size={11} /> Create Playlist
            </button>
          )}
        </div>
      )}

      {/* LIST */}
      {!isLoading && playlists.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">
              {mode === "liked" ? "Liked Playlists" : "Your Playlists"}
            </h1>
            {mode !== "liked" && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white cursor-pointer hover:bg-zinc-400 text-black text-md font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaPlus size={11} /> Create Playlist
              </button>
            )}
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

      {/* MODAL - Only show in non-liked modes */}
      {mode !== "liked" && (
        <CreatePlaylistModal
          isOpen={isCreateOpen}
          onClose={handleClose}
          onSubmit={createPlaylist}
          availableTracks={searchTracks}
          isSearchingTracks={isSearchingTracks}
          trackQuery={trackQuery}
          onTrackQueryChange={setTrackQuery}
        />
      )}
    </div>
  );
}