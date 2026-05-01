"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playlistsApi,
  normalizePlaylistList,
  normalizePlaylist,
} from "@/src/services/playlistsService";
import { Playlist, CreatePlaylistInput } from "@/src/types/playlist";

export function usePlaylists() {
  const getLocalLikedIds = () => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = window.localStorage.getItem("likedPlaylistIds");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set<string>();
    }
  };

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const raw = await playlistsApi.getMyPlaylists();
      const list = normalizePlaylistList(raw);
      const likedIds = getLocalLikedIds();
      setPlaylists(
        list.map((playlist) =>
          likedIds.has(String(playlist.playlistId))
            ? { ...playlist, liked: true }
            : playlist
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchPlaylists();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPlaylists]);

  const createPlaylist = useCallback(
    async (input: CreatePlaylistInput) => {
      const raw = await playlistsApi.createPlaylist(input);
      const created = normalizePlaylist(raw);
      setPlaylists((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      const previous = playlists;
      setPlaylists((prev) =>
        prev.filter((p) => p.playlistId !== playlistId)
      );

      try {
        await playlistsApi.deletePlaylist(playlistId);
      } catch (err) {
        setPlaylists(previous);
        throw err;
      }
    },
    [playlists]
  );

  return {
    playlists,
    isLoading,
    error,
    refetch: fetchPlaylists,
    createPlaylist,
    deletePlaylist,
  };
}