"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playlistsApi,
  normalizePlaylist,
} from "@/src/services/playlistsService";
import { Playlist, UpdatePlaylistInput } from "@/src/types/playlist";

export function usePlaylist(playlistId: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = useCallback(
    async (signal?: AbortSignal) => {
      if (!playlistId) {
        setIsLoading(false);
        return;
      }
      try {
        const raw = await playlistsApi.getPlaylistById(playlistId);
        if (signal?.aborted) return;
        setPlaylist(normalizePlaylist(raw));
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load playlist",
        );
        setPlaylist(null);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [playlistId],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaylist(controller.signal);
    return () => controller.abort();
  }, [fetchPlaylist]);

  const refetch = useCallback(
    (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      return fetchPlaylist(signal);
    },
    [fetchPlaylist],
  );

  const updatePlaylist = useCallback(
    async (data: UpdatePlaylistInput) => {
      const previous = playlist;

      setPlaylist((p) => {
        if (!p) return p;
        const { visibility, ...rest } = data;
        const patch: Partial<Playlist> = {
          ...rest,
          ...(visibility !== undefined
            ? { visibility: visibility.toUpperCase() as "PUBLIC" | "SECRET" }
            : {}),
        };
        return { ...p, ...patch };
      });

      try {
        const raw = await playlistsApi.updatePlaylist(playlistId, data);
        setPlaylist(raw.playlist);
      } catch (err) {
        setPlaylist(previous);
        throw err;
      }
    },
    [playlistId, playlist],
  );

  const addTrack = useCallback(
    async (trackId: string) => {
      const result = await playlistsApi.addTrackToPlaylist(playlistId, trackId);
      setPlaylist((p) => {
        if (!p) return p;
        const newTrack = {
          trackId: result.trackId,
          title: result.title ?? "",
          coverArtUrl: result.coverArtUrl ?? null,
          artist: result.artist,
        };
        return {
          ...p,
          tracks: [...(p.tracks ?? []), newTrack],
          tracksCount: (p.tracksCount ?? 0) + 1,
        };
      });
    },
    [playlistId],
  );

  const removeTrack = useCallback(
    async (trackId: string) => {
      const previous = playlist;
      setPlaylist((p) =>
        p
          ? {
              ...p,
              tracks: p.tracks?.filter((t) => t.trackId !== trackId),
              tracksCount: Math.max(0, (p.tracksCount ?? 0) - 1),
            }
          : p,
      );
      try {
        await playlistsApi.removeTrackFromPlaylist(playlistId, trackId);
      } catch (err) {
        setPlaylist(previous);
        throw err;
      }
    },
    [playlistId, playlist],
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
    [playlistId, playlist],
  );

  return {
    playlist,
    isLoading,
    error,
    refetch,
    updatePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,
  };
}