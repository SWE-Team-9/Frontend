import api from "@/src/services/api";
import { ListeningHistoryItem, RecentlyPlayedItem } from "@/src/types/history";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface HistoryArtistResponse {
  id: string;
  display_name: string;
  handle?: string;
  avatar_url?: string | null;
}

interface RecentTrackResponseItem {
  trackId: string;
  title: string;
  slug?: string;
  artist: HistoryArtistResponse;
  coverArtUrl?: string | null;
  durationMs?: number;
  durationSeconds?: number;
  waveformData?: number[] | null;
  liked?: boolean;
  likesCount?: number;
  reposted?: boolean;
  repostsCount?: number;
  lastPlayedAt: string;
  lastPositionSeconds: number;
}

interface RecentlyPlayedResponse {
  page: number;
  limit: number;
  total: number;
  tracks: RecentTrackResponseItem[];
}

interface ListeningHistoryResponseItem {
  trackId: string;
  title: string;
  slug?: string;
  artist: HistoryArtistResponse;
  coverArtUrl?: string | null;
  durationMs?: number;
  durationSeconds?: number;
  waveformData?: number[] | null;
  liked?: boolean;
  likesCount?: number;
  reposted?: boolean;
  repostsCount?: number;
  playedAt: string;
  positionSeconds: number;
  isCompleted: boolean;
}

interface ListeningHistoryResponse {
  page: number;
  limit: number;
  total: number;
  history: ListeningHistoryResponseItem[];
}


// ===============================
//  MOCK DATA
// ===============================

const MOCK_RECENTLY_PLAYED: RecentlyPlayedItem[] = [
  {
    trackId: "trk_001",
    title: "Layali",
    artist: "Ahmed Hassan",
    artistId: "usr_1",
    artistHandle: "ahmedhassan",
    artistAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 150,
    reposted: false,
    repostsCount: 4,
    lastPlayedAt: "2026-03-07T17:15:00Z",
    lastPositionSeconds: 97,
  },
  {
    trackId: "trk_002",
    title: "Neon Pulse",
    artist: "Synthwave Ghost",
    artistId: "usr_2",
    artistHandle: "synthwaveghost",
    artistAvatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 200,
    reposted: true,
    repostsCount: 15,
    lastPlayedAt: "2026-03-07T15:42:00Z",
    lastPositionSeconds: 120,
  },
  {
    trackId: "trk_003",
    title: "Midnight Circuit",
    artist: "Electric Void",
    artistId: "usr_3",
    artistHandle: "electricvoid",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 100,
    reposted: false,
    repostsCount: 10,
    lastPlayedAt: "2026-03-07T14:00:00Z",
    lastPositionSeconds: 200,
  },
  {
    trackId: "trk_004",
    title: "Coastal Drive",
    artist: "Lo-Fi Horizon",
    artistId: "usr_4",
    artistHandle: "lofihorizon",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 50,
    reposted: true,
    repostsCount: 5,
    lastPlayedAt: "2026-03-06T22:30:00Z",
    lastPositionSeconds: 56,
  },
  {
    trackId: "trk_005",
    title: "Urban Echoes",
    artist: "City Pulse Collective",
    artistId: "usr_5",
    artistHandle: "citypulsecollective",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 75,
    reposted: false,
    repostsCount: 10,
    lastPlayedAt: "2026-03-06T20:00:00Z",
    lastPositionSeconds: 275,
  },
  {
    trackId: "trk_006",
    title: "Digital Rain",
    artist: "Neon Frequencies",
    artistId: "usr_6",
    artistHandle: "neonfrequencies",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 125,
    reposted: true,
    repostsCount: 20,
    lastPlayedAt: "2026-03-06T18:15:00Z",
    lastPositionSeconds: 341,
  },
];

const MOCK_LISTENING_HISTORY: ListeningHistoryItem[] = [
  {
    trackId: "trk_001",
    title: "Layali",
    artist: "Ahmed Hassan",
    artistId: "usr_1",
    artistHandle: "ahmedhassan",
    artistAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 150,
    reposted: false,
    repostsCount: 4,
    playedAt: "2026-03-07T17:15:00Z",
    positionSeconds: 97,
    durationSeconds: 240,
    isCompleted: false,
  },
  {
    trackId: "trk_002",
    title: "Neon Pulse",
    artist: "Synthwave Ghost",
    artistId: "usr_2",
    artistHandle: "synthwaveghost",
    artistAvatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 200,
    reposted: true,
    repostsCount: 15,
    playedAt: "2026-03-07T15:42:00Z",
    positionSeconds: 237,
    durationSeconds: 237,
    isCompleted: true,
  },
  {
    trackId: "trk_003",
    title: "Midnight Circuit",
    artist: "Electric Void",
    artistId: "usr_3",
    artistHandle: "electricvoid",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 100,
    reposted: false,
    repostsCount: 10,
    playedAt: "2026-03-07T14:00:00Z",
    positionSeconds: 200,
    durationSeconds: 312,
    isCompleted: false,
  },
  {
    trackId: "trk_004",
    title: "Coastal Drive",
    artist: "Lo-Fi Horizon",
    artistId: "usr_4",
    artistHandle: "lofihorizon",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 50,
    reposted: true,
    repostsCount: 5,
    playedAt: "2026-03-06T22:30:00Z",
    positionSeconds: 198,
    durationSeconds: 198,
    isCompleted: true,
  },
  {
    trackId: "trk_005",
    title: "Urban Echoes",
    artist: "City Pulse Collective",
    artistId: "usr_5",
    artistHandle: "citypulsecollective",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    liked: true,
    likesCount: 75,
    reposted: false,
    repostsCount: 10,
    playedAt: "2026-03-06T20:00:00Z",
    positionSeconds: 56,
    durationSeconds: 275,
    isCompleted: false,
  },
  {
    trackId: "trk_006",
    title: "Digital Rain",
    artist: "Neon Frequencies",
    artistId: "usr_6",
    artistHandle: "neonfrequencies",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=400&fit=crop",
    liked: false,
    likesCount: 125,
    reposted: true,
    repostsCount: 20,
    playedAt: "2026-03-06T18:15:00Z",
    positionSeconds: 341,
    durationSeconds: 341,
    isCompleted: true,
  },
];

// ===============================
//  GET RECENTLY PLAYED
// ===============================

export async function getRecentlyPlayed(limit = 6, page = 1): Promise<RecentlyPlayedItem[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const start = (page - 1) * limit;
    return MOCK_RECENTLY_PLAYED.slice(start, start + limit);
  }

  const { data } = await api.get<RecentlyPlayedResponse>(
    `/player/history/recent?page=${page}&limit=${limit}`
  );

  return data.tracks.map((track) => ({
    trackId: track.trackId,
    title: track.title,
    slug: track.slug,
    artist: track.artist.display_name,
    artistId: track.artist.id,
    artistHandle: track.artist.handle,
    artistAvatarUrl: track.artist.avatar_url ?? null,
    coverArtUrl: track.coverArtUrl ?? null,
    liked: track.liked ?? false,
    likesCount: track.likesCount ?? 0,
    reposted: track.reposted ?? false,
    repostsCount: track.repostsCount ?? 0,
    durationMs: track.durationMs,
    durationSeconds:
      track.durationSeconds ??
      (track.durationMs ? track.durationMs / 1000 : undefined),
    waveformData: track.waveformData ?? null,
    lastPlayedAt: track.lastPlayedAt,
    lastPositionSeconds: track.lastPositionSeconds,
  }));
}

// ===============================
//  GET LISTENING HISTORY
// ===============================

export async function getListeningHistory(limit = 20, page = 1): Promise<ListeningHistoryItem[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700));
    const start = (page - 1) * limit;
    return MOCK_LISTENING_HISTORY.slice(start, start + limit);
  }

  const { data } = await api.get<ListeningHistoryResponse>(
    `/player/history?page=${page}&limit=${limit}`
  );

  return data.history.map((track) => ({
    trackId: track.trackId,
    title: track.title,
    slug: track.slug,
    artist: track.artist.display_name,
    artistId: track.artist.id,
    artistHandle: track.artist.handle,
    artistAvatarUrl: track.artist.avatar_url ?? null,
    coverArtUrl: track.coverArtUrl ?? null,
    liked: track.liked ?? false,
    likesCount: track.likesCount ?? 0,
    reposted: track.reposted ?? false,
    repostsCount: track.repostsCount ?? 0,
    durationMs: track.durationMs,
    durationSeconds:
      track.durationSeconds ??
      (track.durationMs ? track.durationMs / 1000 : undefined),
    waveformData: track.waveformData ?? null,
    playedAt: track.playedAt,
    positionSeconds: track.positionSeconds,
    isCompleted: track.isCompleted,
  }));
}

// ===============================
//  CLEAR LISTENING HISTORY
// ===============================

export async function clearListeningHistory() {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return;
  }

  const { data } = await api.delete(`/player/history`);
  return data;
}
