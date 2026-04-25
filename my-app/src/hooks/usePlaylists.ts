"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playlistsApi,
  normalizePlaylistList,
  normalizePlaylist,
} from "@/src/services/api/playlists";
import { Playlist, CreatePlaylistInput } from "@/src/types/playlist";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const raw = await playlistsApi.getMyPlaylists();
      const list = normalizePlaylistList(raw);
      setPlaylists(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
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
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   playlistsApi,
//   normalizePlaylistList,
//   normalizePlaylist,
// } from "@/src/services/api/playlists";
// import { MOCK_PLAYLISTS, USE_MOCK } from "@/src/services/api/mockPlaylists";
// import { Playlist, CreatePlaylistInput } from "@/src/types/playlist";

// export function usePlaylists() {
//   const [playlists, setPlaylists] = useState<Playlist[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchPlaylists = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const raw = await playlistsApi.getMyPlaylists();
//       const list = normalizePlaylistList(raw);

//       if (list.length === 0 && USE_MOCK) {
//         setPlaylists(MOCK_PLAYLISTS);
//       } else {
//         setPlaylists(list);
//       }
//     } catch (err) {
//       console.warn("Backend unavailable, using mock data:", err);
//       if (USE_MOCK) {
//         setPlaylists(MOCK_PLAYLISTS);
//       } else {
//         setPlaylists([]);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPlaylists();
//   }, [fetchPlaylists]);

//   const createPlaylist = useCallback(async (input: CreatePlaylistInput) => {
//     try {
//       const raw = await playlistsApi.createPlaylist(input);
//       const created = normalizePlaylist(raw);
//       setPlaylists((prev) => [created, ...prev]);
//       return created;
//     } catch (err) {
//       console.warn("Backend unavailable, creating locally:", err);
//       const created: Playlist = {
//         playlistId: `local_${Date.now()}`,
//         title: input.title,
//         description: input.description,
//         visibility: input.visibility,
//         tracksCount: 0,
//         owner: { id: "usr_1", display_name: "You" },
//         tracks: [],
//       };
//       setPlaylists((prev) => [created, ...prev]);
//       return created;
//     }
//   }, []);

//     const deletePlaylist = useCallback(
//     async (playlistId: string) => {
//       const previous = playlists;
//       setPlaylists((prev) => prev.filter((p) => p.playlistId !== playlistId));
//       try {
//         await playlistsApi.deletePlaylist(playlistId);
//       } catch (err) {
//         setPlaylists(previous);
//         throw err;
//       }
//     },
//     [playlists]
//   );

//   return {
//     playlists,
//     isLoading,
//     error,
//     refetch: fetchPlaylists,
//     createPlaylist,
//     deletePlaylist,
//   };
// }