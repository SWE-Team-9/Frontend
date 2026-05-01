import api from "@/src/services/api";

export interface FeedItem {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  coverArtUrl?: string | null;

  createdAt?: string;
  publishedAt?: string;

  status: "PROCESSING" | "FINISHED";
  visibility: "PUBLIC" | "PRIVATE";

  durationMs?: number;
  genre?: string;
  tags?: string[];
  waveformData?: number[] | null;

  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;

  uploaderId?: string;
  uploader?: {
    profile?: {
      handle?: string;
      displayName?: string;
      avatarUrl?: string | null;
    };
  };
}

export interface FeedPagination {
  page: number;
  limit: number;
  offset?: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
}

export interface FeedResponse {
  data: FeedItem[];
  pagination: FeedPagination;
}

export async function getFeed(page = 1, limit = 20): Promise<FeedResponse> {
  const { data } = await api.get<FeedResponse>("/feed", {
    params: { page, limit },
  });

  return data;
}