"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playlistsApi,
  normalizePlaylist,
} from "@/src/services/playlistsService";
import { Playlist, CreatePlaylistInput } from "@/src/types/playlist";

function getLocalLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem("likedPlaylistIds");
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

export function usePlaylists(userId?: string, isOwner?: boolean) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true); 
      setError(null); 
      try {
        let raw: Playlist[];
        
        if (userId) {
          // Owner viewing their own profile
          if (isOwner) {
            raw = await playlistsApi.getMyPlaylists();
          } else {
            // For other users
            raw = await playlistsApi.getUserPlaylists(userId);
          }
        } else {
          // No userId = definitely the current user
          raw = await playlistsApi.getMyPlaylists();
        }
        
        if (signal?.aborted) return;
        const likedIds = getLocalLikedIds();
        setPlaylists(
          raw.map((p) =>
            p.liked === undefined && likedIds.has(String(p.playlistId))
              ? { ...p, liked: true }
              : p,
          ),
        );
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load playlists",
        );
        setPlaylists([]);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [userId, isOwner],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaylists(controller.signal);
    return () => controller.abort();
  }, [fetchPlaylists]);

  const refetch = useCallback(
    (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      return fetchPlaylists(signal);
    },
    [fetchPlaylists],
  );

  const createPlaylist = useCallback(async (input: CreatePlaylistInput) => {
    const raw = await playlistsApi.createPlaylist(input);
    const created = normalizePlaylist(raw);
    setPlaylists((prev) => [created, ...prev]);
    return created;
  }, []);

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      const previous = playlists;
      setPlaylists((prev) => prev.filter((p) => p.playlistId !== playlistId));
      try {
        await playlistsApi.deletePlaylist(playlistId);
      } catch (err) {
        setPlaylists(previous);
        throw err;
      }
    },
    [playlists],
  );

  return {
    playlists,
    isLoading,
    error,
    refetch,
    createPlaylist,
    deletePlaylist,
  };
}