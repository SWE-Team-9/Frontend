import api from "@/src/services/api";
import {
  Playlist,
  PlaylistTrack,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from "@/src/types/playlist";

const BASE = "/playlists";

export interface AddTrackResponse {
  message: string;
  playlistId: string;
  trackId: string;
  title: string;
  coverArtUrl: string | null;
  artist: {
    id: string;
    name: string;
    handle: string | null;
  };
}

export interface TopPlaylistOwner {
  id: string;
  displayName: string;
}

export interface TopPlaylistItem {
  playlistId: string;
  title: string;
  visibility: "PUBLIC" | "SECRET" | "PRIVATE";
  tracksCount: number;
  likesCount: number;
  isLiked: boolean;
  coverImageUrl: string | null;
  genre: string;
  owner: TopPlaylistOwner;
}

export interface TopPlaylistsGenreGroup {
  genre: string;
  playlists: TopPlaylistItem[];
}

export interface TopPlaylistsResponse {
  genres: TopPlaylistsGenreGroup[];
}

export interface PlaylistsService {
  createPlaylist: (data: CreatePlaylistInput) => Promise<unknown>;
  getMyPlaylists: (page?: number, limit?: number) => Promise<Playlist[]>;
  getPlaylistById: (
    playlistId: string,
    limit?: number,
    offset?: number,
  ) => Promise<Playlist>;
  getTopPlaylists: () => Promise<Playlist[]>;
  getEditDetails: (playlistId: string) => Promise<{
    playlistId: string;
    title: string;
    description: string | null;
    visibility: string;
    slug: string;
    coverImageUrl: string | null;
    type: string | null;
    releaseDate: string | null;
    genre: string | null;
    tags: string[];
    tracks?: PlaylistTrack[];
  }>;
  getLikedPlaylists: (page?: number, limit?: number) => Promise<Playlist[]>;
  getUserPlaylists: (
    userId: string,
    page?: number,
    limit?: number,
  ) => Promise<Playlist[]>;
  updatePlaylist: (
    playlistId: string,
    data: UpdatePlaylistInput,
  ) => Promise<{ message: string; playlist: Playlist }>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  likePlaylist: (playlistId: string) => Promise<{ message: string }>;
  unlikePlaylist: (playlistId: string) => Promise<{ message: string }>;
  getRecentPlaylists: (limit?: number) => Promise<Playlist[]>;
  uploadCover: (
    playlistId: string,
    file: File,
  ) => Promise<{ message: string; coverImageUrl: string }>;
  addTrackToPlaylist: (
    playlistId: string,
    trackId: string,
  ) => Promise<AddTrackResponse>;
  removeTrackFromPlaylist: (
    playlistId: string,
    trackId: string,
  ) => Promise<{ message: string }>;
  reorderTracks: (
    playlistId: string,
    orderedTrackIds: string[],
  ) => Promise<{ message: string }>;
  getSecretPlaylist: (secretToken: string) => Promise<Playlist>;
  getEmbedCode: (
    playlistId: string,
    options?: Record<string, unknown>,
  ) => Promise<{ playlistId: string; embedCode: string }>;
}

export const playlistsApi: PlaylistsService = {
  createPlaylist: (data: CreatePlaylistInput) =>
    api.post(BASE, data).then((r) => r.data),

  getMyPlaylists: (page = 1, limit = 20) =>
    api
      .get(`${BASE}/me`, { params: { page, limit } })
      .then((r) => normalizePlaylistList(r.data)),

  getPlaylistById: (playlistId: string, limit = 100, offset = 0) =>
    api
      .get(`${BASE}/${playlistId}`, { params: { limit, offset } })
      .then((r) => normalizePlaylist(r.data)),

   getLikedPlaylists: (page = 1, limit = 20) =>
  api
    .get(`${BASE}/me/liked`, { params: { page, limit } })
    .then((r) => normalizePlaylistList(r.data)),

  getUserPlaylists: (userId: string, page = 1, limit = 20) =>
    api
      .get(`/users/${userId}/playlists`, { params: { page, limit } })
      .then((r) => normalizePlaylistList(r.data)),

  getEditDetails: (playlistId: string) =>
    api.get(`${BASE}/${playlistId}/edit`).then((r) => r.data),

  updatePlaylist: (playlistId: string, data: UpdatePlaylistInput) =>
    api.patch(`${BASE}/${playlistId}`, data).then((r) => r.data),

  deletePlaylist: (playlistId: string) =>
    api.delete<void>(`${BASE}/${playlistId}`).then((r) => r.data),

  likePlaylist: (playlistId: string) =>
    api.post(`${BASE}/${playlistId}/like`).then((r) => r.data),

  unlikePlaylist: (playlistId: string) =>
    api.delete(`${BASE}/${playlistId}/like`).then((r) => r.data),

  getRecentPlaylists: (limit = 10) =>
    api
      .get(`${BASE}/recent`, { params: { limit } })
      .then((r) => normalizePlaylistList(r.data)),

  getTopPlaylists: () =>
    api.get<TopPlaylistsResponse>(`${BASE}/top`).then((r) => {
      const playlists = r.data.genres.flatMap((group) =>
        group.playlists.map((playlist) =>
          normalizePlaylist({
            ...playlist,
            liked: playlist.isLiked,
            cover: playlist.coverImageUrl,
            coverImageUrl: playlist.coverImageUrl,
            owner: {
              ...playlist.owner,
              display_name: playlist.owner.displayName,
            },
          }),
        ),
      );

      return playlists;
    }),


  uploadCover: (playlistId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`${BASE}/${playlistId}/cover`, form).then((r) => r.data);
  },

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    api.post(`${BASE}/${playlistId}/tracks`, { trackId }).then((r) => r.data),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    api.delete(`${BASE}/${playlistId}/tracks/${trackId}`).then((r) => r.data),

  reorderTracks: (playlistId: string, orderedTrackIds: string[]) =>
    api
      .patch(`${BASE}/${playlistId}/reorder`, { orderedTrackIds })
      .then((r) => r.data),

  getSecretPlaylist: async (secretToken: string): Promise<Playlist> => {
    const res = await api
      .get(`${BASE}/secret/${secretToken}`)
      .then((r) => r.data);
    const playlistId =
      (res as { playlistId?: string; playlist?: { id?: string } }).playlistId ??
      (res as { playlist?: { id?: string } }).playlist?.id;
    if (!playlistId) throw new Error("Secret playlist not found");
    return playlistsApi.getPlaylistById(playlistId);
  },

  getEmbedCode: (playlistId: string, options?: Record<string, unknown>) =>
    api
      .get(`${BASE}/${playlistId}/embed`, { params: options })
      .then((r) => r.data),
};

// ─── Normalizers ─────────────────────────────────────────────────────────────

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

interface RawTrack {
  trackId?: string;
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  coverArtUrl?: string | null;
  coverImageUrl?: string | null;
  cover?: string | null;
  durationMs?: number | null;
  duration_ms?: number | null;
  likesCount?: number;
  likes_count?: number;
  repostsCount?: number;
  reposts_count?: number;
  artist?: {
    id?: string;
    userId?: string;
    name?: string;
    displayName?: string;
    display_name?: string;
    handle?: string | null;
  };
}

export function normalizePlaylist(raw: unknown): Playlist {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  const inner = r.playlist ?? r.data ?? r;

  // liked
  const pickLiked = (
    source: Record<string, unknown> | null | undefined,
  ): unknown =>
    source?.liked ??
    source?.isLiked ??
    source?.is_liked ??
    source?.hasLiked ??
    source?.has_liked ??
    source?.viewerHasLiked ??
    source?.viewer_has_liked ??
    source?.viewerLiked ??
    source?.viewer_liked ??
    source?.likedByCurrentUser ??
    source?.liked_by_current_user ??
    source?.isLikedByCurrentUser ??
    source?.is_liked_by_current_user ??
    source?.likedByMe ??
    source?.liked_by_me ??
    source?.userHasLiked ??
    source?.user_has_liked ??
    source?.likedByUser ??
    source?.liked_by_user ??
    source?.likedByViewer ??
    source?.liked_by_viewer;

  const likedRaw =
    pickLiked(inner) ??
    pickLiked(inner?.viewer) ??
    pickLiked(inner?.interactions) ??
    pickLiked(inner?.interaction) ??
    pickLiked(inner?.stats) ??
    pickLiked(r);

  const liked =
    typeof likedRaw === "boolean"
      ? likedRaw
      : likedRaw == null
        ? undefined
        : Boolean(likedRaw);

  // likesCount
  const likesCountRaw =
    inner.likesCount ??
    inner.likes_count ??
    inner.likeCount ??
    inner.like_count ??
    inner.stats?.likesCount ??
    inner.stats?.likes_count ??
    inner.metrics?.likesCount ??
    inner.metrics?.likes_count ??
    inner.interactions?.likesCount ??
    inner.interactions?.likes_count ??
    inner.interaction?.likesCount ??
    inner.interaction?.likes_count;

  let likesCount: number | undefined;
  if (typeof likesCountRaw === "number") {
    likesCount = likesCountRaw;
  } else if (typeof likesCountRaw === "string" && likesCountRaw.trim()) {
    const parsed = Number(likesCountRaw);
    if (Number.isFinite(parsed)) likesCount = parsed;
  }

  // owner
  const rawOwner = inner.owner ?? null;
  const owner = rawOwner
    ? {
      ...rawOwner,
      display_name:
        rawOwner.display_name ??
        rawOwner.displayName ??
        rawOwner.name ??
        null,
      displayName:
        rawOwner.displayName ??
        rawOwner.display_name ??
        rawOwner.name ??
        null,
      handle: rawOwner.handle ?? null,
      id: rawOwner.id ?? rawOwner.userId ?? rawOwner.user_id ?? null,
    }
    : null;

  // tracks
  const tracks = Array.isArray(inner.tracks)
    ? (inner.tracks as RawTrack[]).map((t) => ({
      trackId: t.trackId ?? t.id ?? t._id ?? "",
      title: t.title ?? t.name ?? "Untitled",
      coverArtUrl: t.coverArtUrl ?? t.coverImageUrl ?? t.cover ?? null,
      durationMs: t.durationMs ?? t.duration_ms ?? null,
      likesCount:
        typeof t.likesCount === "number"
          ? t.likesCount
          : typeof t.likes_count === "number"
            ? t.likes_count
            : undefined,
      repostsCount:
        typeof t.repostsCount === "number"
          ? t.repostsCount
          : typeof t.reposts_count === "number"
            ? t.reposts_count
            : undefined,
      artist: t.artist
        ? {
          id: t.artist.id ?? t.artist.userId ?? "",
          name:
            t.artist.name ??
            t.artist.displayName ??
            t.artist.display_name ??
            "",
          handle: t.artist.handle ?? null,
        }
        : undefined,
    }))
    : inner.tracks;

  return {
    ...inner,
    liked,
    likesCount,
    playlistId: inner.playlistId ?? inner.id ?? inner._id ?? "",
    title: inner.title ?? inner.name ?? "",
    visibility: inner.visibility ?? "PUBLIC",
    description: inner.description ?? null,
    secretToken: inner.secretToken ?? inner.secret_token ?? null,
    cover: inner.coverImageUrl ?? inner.coverArtUrl ?? inner.cover ?? null,
    genre: inner.genre ?? null,
    releaseDate: inner.releaseDate ?? inner.release_date ?? null,
    tags: Array.isArray(inner.tags) ? inner.tags : [],
    owner,
    tracksCount:
      inner.tracksCount ??
      inner.tracks_count ??
      (Array.isArray(inner.tracks) ? inner.tracks.length : 0),
    tracks,
  };
}

export function extractMessage(raw: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  return r.message ?? r.data?.message ?? null;
}
