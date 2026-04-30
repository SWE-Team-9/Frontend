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