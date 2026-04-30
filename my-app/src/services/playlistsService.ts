import api from "@/src/services/api";
import {
  Playlist,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from "@/src/types/playlist";

const BASE = "/playlists";

export const playlistsApi = {
  createPlaylist: (data: CreatePlaylistInput) =>
    api
      .post<unknown>(BASE, { trackIds: [], ...data })
      .then((r) => r.data),

  getMyPlaylists: (page = 1, limit = 20) =>
    api
      .get<unknown>(`${BASE}/me`, { params: { page, limit } })
      .then((r) => r.data),

  getPlaylistById: (playlistId: string, limit = 100, offset = 0) =>
    api
      .get<unknown>(`${BASE}/${playlistId}`, { params: { limit, offset } })
      .then((r) => r.data),

  getEditDetails: (playlistId: string) =>
    api
      .get<{
        playlistId: string;
        title: string;
        description: string | null;
        visibility: string;
        slug: string;
        coverImageUrl: string | null;
        type: string | null;
        releaseDate: string | null;
        genreId: number | null;
        tags: string[];
      }>(`${BASE}/${playlistId}/edit`)
      .then((r) => r.data),

  updatePlaylist: (playlistId: string, data: UpdatePlaylistInput) =>
    api
      .patch<{ message: string; playlist: unknown }>(`${BASE}/${playlistId}`, data)
      .then((r) => r.data),

  deletePlaylist: (playlistId: string) =>
    api
      .delete<void>(`${BASE}/${playlistId}`)
      .then((r) => r.data),

  likePlaylist: (playlistId: string) =>
    api
      .post<{ message: string }>(`${BASE}/${playlistId}/like`)
      .then((r) => r.data),

  unlikePlaylist: (playlistId: string) =>
    api
      .delete<{ message: string }>(`${BASE}/${playlistId}/like`)
      .then((r) => r.data),

  getRecentPlaylists: (limit = 10) =>
    api
      .get<unknown>(`${BASE}/recent`, { params: { limit } })
      .then((r) => r.data),

  uploadCover: (playlistId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ message: string; coverImageUrl: string }>(
        `${BASE}/${playlistId}/cover`,
        form,
      )
      .then((r) => r.data);
  },

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    api
      .post<{ message: string; playlistId: string; trackId: string }>(
        `${BASE}/${playlistId}/tracks`,
        { trackId },
      )
      .then((r) => r.data),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    api
      .delete<{ message: string }>(`${BASE}/${playlistId}/tracks/${trackId}`)
      .then((r) => r.data),

  reorderTracks: (playlistId: string, orderedTrackIds: string[]) =>
    api
      .patch<{ message: string }>(`${BASE}/${playlistId}/reorder`, {
        orderedTrackIds,
      })
      .then((r) => r.data),

  getSecretPlaylist: (secretToken: string) =>
    api
      .get<unknown>(`${BASE}/secret/${secretToken}`)
      .then((r) => r.data),

  getEmbedCode: (
    playlistId: string,
    options?: {
      theme?: "light" | "dark";
      autoplay?: boolean;
      start?: number;
      hideArtwork?: boolean;
      width?: number;
      height?: number;
    },
  ) =>
    api
      .get<{ playlistId: string; embedCode: string }>(
        `${BASE}/${playlistId}/embed`,
        { params: options },
      )
      .then((r) => r.data),
};

// Normalizers

export function normalizePlaylistList(raw: unknown): Playlist[] {
  if (!raw) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;

  let list: unknown[] = [];
  if (Array.isArray(r)) list = r;
  else if (Array.isArray(r.playlists)) list = r.playlists;
  else if (Array.isArray(r.data?.playlists)) list = r.data.playlists;
  else if (Array.isArray(r.data)) list = r.data;
  else if (Array.isArray(r.items)) list = r.items;
  else if (Array.isArray(r.results)) list = r.results;

  return list.map(normalizePlaylist);
}

export function normalizePlaylist(raw: unknown): Playlist {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  const inner = r.playlist ?? r.data ?? r;

  return {
    ...inner,
    playlistId: inner.playlistId ?? inner.id ?? inner._id ?? "",
    title: inner.title ?? inner.name ?? "",
    visibility: inner.visibility ?? "PUBLIC",
    description: inner.description ?? null,
    secretToken: inner.secretToken ?? inner.secret_token ?? null,
    cover: inner.coverImageUrl ?? inner.coverArtUrl ?? inner.cover ?? null,
    owner: inner.owner ?? null,
    tracksCount:
      inner.tracksCount ??
      inner.tracks_count ??
      (Array.isArray(inner.tracks) ? inner.tracks.length : 0),
    tracks: Array.isArray(inner.tracks)
      ? inner.tracks.map((t: Record<string, unknown>) => ({
          ...t,
          trackId: t.trackId ?? t.id ?? t._id ?? "",
        }))
      : inner.tracks,
  };
}

export function extractMessage(raw: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  return r.message ?? r.data?.message ?? null;
}