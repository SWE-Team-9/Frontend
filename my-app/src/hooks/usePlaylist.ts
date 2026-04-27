"use client";

import { useState, useEffect, useCallback } from "react";
import { playlistsApi, normalizePlaylist } from "@/src/services/api/playlists";
import { Playlist, UpdatePlaylistInput } from "@/src/types/playlist";

export function usePlaylist(playlistId: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = useCallback(async () => {
    if (!playlistId) return;
    setIsLoading(true);
    setError(null);
    try {
      const raw = await playlistsApi.getPlaylistById(playlistId);
      setPlaylist(normalizePlaylist(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlist");
      setPlaylist(null);
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const updatePlaylist = useCallback(
    async (data: UpdatePlaylistInput) => {
      const previous = playlist;
      setPlaylist((p) => (p ? { ...p, ...data } : p));
      try {
        await playlistsApi.updatePlaylist(playlistId, data);
      } catch (err) {
        setPlaylist(previous);
        throw err;
      }
    },
    [playlistId, playlist]
  );

  const addTrack = useCallback(
    async (trackId: string) => {
      await playlistsApi.addTrackToPlaylist(playlistId, trackId);
      await fetchPlaylist();
    },
    [playlistId, fetchPlaylist]
  );

  const removeTrack = useCallback(
    async (trackId: string) => {
      const previous = playlist;
      setPlaylist((p) =>
        p ? { ...p, tracks: p.tracks?.filter((t) => t.trackId !== trackId) } : p
      );
      try {
        await playlistsApi.removeTrackFromPlaylist(playlistId, trackId);
      } catch (err) {
        setPlaylist(previous);
        throw err;
      }
    },
    [playlistId, playlist]
  );

  const reorderTracks = useCallback(
    async (orderedTrackIds: string[]) => {
      const previous = playlist;
      if (playlist?.tracks) {
        const map = new Map(playlist.tracks.map((t) => [t.trackId, t]));
        const reordered = orderedTrackIds
          .map((id) => map.get(id))
          .filter((t): t is NonNullable<typeof t> => Boolean(t));
        setPlaylist({ ...playlist, tracks: reordered });
      }
      try {
        await playlistsApi.reorderTracks(playlistId, orderedTrackIds);
      } catch (err) {
        setPlaylist(previous);
        throw err;
      }
    },
    [playlistId, playlist]
  );

  return {
    playlist,
    isLoading,
    error,
    refetch: fetchPlaylist,
    updatePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,
  };
}