import {
  Playlist,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from "@/src/types/playlist";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE = `${API_BASE_URL}/playlists`;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  getPlaylistById: (playlistId: string, limit = 100, offset = 0) =>
    request<unknown>(`${BASE}/${playlistId}?limit=${limit}&offset=${offset}`),

  updatePlaylist: (playlistId: string, data: UpdatePlaylistInput) =>
    request<{ message: string; playlist: unknown }>(`${BASE}/${playlistId}`, {
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

  getEmbedCode: (
    playlistId: string,
    options?: {
      theme?: "light" | "dark";
      autoplay?: boolean;
      start?: number;
      hideArtwork?: boolean;
      width?: number;
      height?: number;
    }
  ) => {
    const qs = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        if (v !== undefined) qs.set(k, String(v));
      });
    }
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ playlistId: string; embedCode: string }>(
      `${BASE}/${playlistId}/embed${suffix}`
    );
  },
};

export function normalizePlaylistList(raw: unknown): Playlist[] {
  if (!raw) return [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;

  let list: unknown[] = [];
  if (Array.isArray(r))                       list = r;
  else if (Array.isArray(r.playlists))        list = r.playlists;
  else if (Array.isArray(r.data?.playlists))  list = r.data.playlists;
  else if (Array.isArray(r.data))             list = r.data;
  else if (Array.isArray(r.items))            list = r.items;
  else if (Array.isArray(r.results))          list = r.results;

  return list.map(normalizePlaylist);
}


export function normalizePlaylist(raw: unknown): Playlist {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  // Update endpoint returns { message, playlist: {...} }
  const inner = r.playlist ?? r.data ?? r;

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


export function extractMessage(raw: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (raw ?? {}) as any;
  return r.message ?? r.data?.message ?? null;
}