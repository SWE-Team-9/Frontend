import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface TrackDetails {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  durationMs?: number;
  genre?: string;
}

const MOCK_TRACK_DETAILS: Record<string, TrackDetails> = {
  trk_001: {
    trackId: "trk_001",
    title: "Layali",
    artist: "Ahmed Hassan",
    artistId: "usr_1",
    artistHandle: "ahmedhassan",
    artistAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop",
    durationMs: 240000,
    genre: "Arabic Pop",
  },
  trk_002: {
    trackId: "trk_002",
    title: "Neon Pulse",
    artist: "Synthwave Ghost",
    artistId: "usr_2",
    artistHandle: "synthwaveghost",
    artistAvatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    coverArtUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    durationMs: 237000,
    genre: "Synthwave",
  },
  trk_003: {
    trackId: "trk_003",
    title: "Midnight Circuit",
    artist: "Electric Void",
    artistId: "usr_3",
    artistHandle: "electricvoid",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=400&fit=crop",
    durationMs: 312000,
    genre: "Electronic",
  },
  trk_004: {
    trackId: "trk_004",
    title: "Coastal Drive",
    artist: "Lo-Fi Horizon",
    artistId: "usr_4",
    artistHandle: "lofihorizon",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    durationMs: 198000,
    genre: "Lo-Fi",
  },
  trk_005: {
    trackId: "trk_005",
    title: "Urban Echoes",
    artist: "City Pulse Collective",
    artistId: "usr_5",
    artistHandle: "citypulsecollective",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    durationMs: 275000,
    genre: "Hip-Hop",
  },
  trk_006: {
    trackId: "trk_006",
    title: "Digital Rain",
    artist: "Neon Frequencies",
    artistId: "usr_6",
    artistHandle: "neonfrequencies",
    artistAvatarUrl: null,
    coverArtUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=400&fit=crop",
    durationMs: 341000,
    genre: "Ambient",
  },
};

// ===============================
//  GET TRACK DETAILS
// ===============================

export async function getTrackDetails(trackId: string): Promise<TrackDetails> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));

    const mock = MOCK_TRACK_DETAILS[trackId];
    if (mock) return mock;

    return {
      trackId,
      title: "Unknown Track",
      artist: "Unknown Artist",
      artistId: "usr_unknown",
      artistHandle: undefined,
      artistAvatarUrl: null,
      coverArtUrl: null,
      durationMs: 0,
      genre: undefined,
    };
  }

  const { data } = await api.get<TrackDetails>(`/tracks/${trackId}`);
  return data;
}
