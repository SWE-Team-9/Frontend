import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface TrendingTrack {
  id: string;
  title: string;
  slug?: string;
  coverArtUrl?: string | null;
  uploaderId: string;
  uploader: {
    userId?: string;
    id?: string;
    handle?: string;
    displayName?: string;
    display_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
  };
  recentPlays?: number;
  recentLikes?: number;
  velocityScore?: number;
  liked?: boolean;
}

export interface TrendingResponse {
  windowDays: number;
  items: TrendingTrack[];
}

const MOCK_TRENDING: TrendingTrack[] = [
  {
    id: "trk_001",
    title: "Trending Track 1",
    coverArtUrl: "/images/track-placeholder.png",
    uploaderId: "usr_1",
    uploader: {
      userId: "usr_1",
      displayName: "Mock Artist",
      handle: "mock-artist",
    },
    liked: false,
  },
];

export async function getTrendingTracks(
  limit = 20,
  windowDays = 7,
): Promise<TrendingResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      windowDays,
      items: MOCK_TRENDING.slice(0, limit),
    };
  }

  const { data } = await api.get<TrendingResponse>("/discovery/trending", {
    params: { limit, windowDays },
  });

  return data;
}

export const GENRES = [
  "electronic",
  "hip-hop",
  "pop",
  "rock",
  "alternative",
  "ambient",
  "classical",
  "jazz",
  "r-b-soul",
  "metal",
  "folk",
  "country",
  "reggaeton",
  "dancehall",
  "drum-bass",
  "house",
  "techno",
  "deep-house",
  "trance",
  "lo-fi",
  "indie",
  "punk",
  "blues",
  "latin",
  "afrobeat",
  "trap",
  "experimental",
  "world",
  "gospel",
  "spoken-word",
  "quran",
  "sha3by",
  "islamic",
];

export function formatGenreName(slug: string) {
  return slug
    .split("-")
    .map((word) => {
      if (word === "r") return "R";
      if (word === "b") return "B";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export interface GenreTrendingTrack {
  trackId: string;
  title: string;
  slug?: string;
  artist: {
    id: string;
    displayName: string;
    handle?: string;
    avatarUrl?: string | null;
  };
  genre: {
    slug: string;
    name: string;
  };
  coverArtUrl?: string | null;
  durationMs?: number;
  waveformData?: number[];
  likesCount?: number;
  repostsCount?: number;
  createdAt?: string;
  publishedAt?: string;
}

export interface GenreTrendingResponse {
  genre: {
    slug: string;
    name: string;
  };
  limit: number;
  total: number;
  tracks: GenreTrendingTrack[];
}

export async function getTrendingTracksByGenre(
  genreSlug: string,
  limit = 5,
): Promise<GenreTrendingResponse> {
  const { data } = await api.get<GenreTrendingResponse>(
    `/discovery/trending/genres/${genreSlug}/tracks`,
    {
      params: { limit },
    },
  );

  return data;
}