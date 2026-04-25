import {
  Playlist,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from "@/src/types/playlist";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE = `${API_BASE_URL}/api/v1/playlists`;

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      message = text || res.statusText;
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status}: ${message}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  if (!text) return undefined as unknown as T;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

export const playlistsApi = {
  createPlaylist: (data: CreatePlaylistInput) =>
    request<unknown>(BASE, { method: "POST", body: JSON.stringify(data) }),

  getMyPlaylists: (page = 1, limit = 20) =>
    request<unknown>(`${BASE}/me?page=${page}&limit=${limit}`),

  getPlaylistById: (playlistId: string) =>
    request<unknown>(`${BASE}/${playlistId}`),

  updatePlaylist: (playlistId: string, data: UpdatePlaylistInput) =>
    request<{ message: string }>(`${BASE}/${playlistId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePlaylist: (playlistId: string) =>
    request<void>(`${BASE}/${playlistId}`, { method: "DELETE" }),

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    request<{ message: string; playlistId: string; trackId: string }>(
      `${BASE}/${playlistId}/tracks`,
      { method: "POST", body: JSON.stringify({ trackId }) }
    ),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    request<{ message: string }>(`${BASE}/${playlistId}/tracks/${trackId}`, {
      method: "DELETE",
    }),

  reorderTracks: (playlistId: string, orderedTrackIds: string[]) =>
    request<{ message: string }>(`${BASE}/${playlistId}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ orderedTrackIds }),
    }),

  getSecretPlaylist: (secretToken: string) =>
    request<unknown>(`${BASE}/secret/${secretToken}`),

  getEmbedCode: (playlistId: string) =>
    request<{ playlistId: string; embedCode: string }>(`${BASE}/${playlistId}/embed`),
};

// Normalize different backend response shapes into a flat Playlist[]
export function normalizePlaylistList(raw: unknown): Playlist[] {
  if (!raw) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;

  let list: unknown[] = [];

  if (Array.isArray(r)) {
    list = r;
  } else if (Array.isArray(r.playlists)) {
    list = r.playlists;
  } else if (Array.isArray(r.data?.playlists)) {
    list = r.data.playlists;
  } else if (Array.isArray(r.data)) {
    list = r.data;
  } else if (Array.isArray(r.items)) {
    list = r.items;
  } else if (Array.isArray(r.results)) {
    list = r.results;
  }

  return list.map(normalizePlaylist);
}

// Normalize one playlist (handles id/playlistId/_id field variations)
export function normalizePlaylist(raw: unknown): Playlist {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  const inner = r.data ?? r;

  return {
    ...inner,
    playlistId: inner.playlistId ?? inner.id ?? inner._id ?? "",
    title: inner.title ?? inner.name ?? "",
    visibility: inner.visibility ?? "PUBLIC",
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

// Extract optional message field from secret playlist response
export function extractMessage(raw: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  return r.message ?? r.data?.message ?? null;
}