import api from "@/src/services/api";
import type { SearchResponse, SearchType } from "@/src/types/search";
import { mockSearch } from "@/src/services/mocks/discoveryMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface SearchParams {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}interface BackendUser {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}
interface BackendTrack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverArtUrl: string | null;
  uploaderId: string;
}

interface BackendPlaylist {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  coverArtUrl: string | null;
}

interface BackendSearchResponse {
  data: {
    users: BackendUser[];
    tracks: BackendTrack[];
    playlists: BackendPlaylist[];
  };
  meta: {
    current_page: number;
    total_results: number;
    total_pages: number;
  };
}

function mapToSearchResponse(raw: BackendSearchResponse): SearchResponse {
  return {
    data: {
      users: raw.data.users.map((u) => ({
        id: u.userId,
        display_name: u.displayName,
        handle: u.handle,
        avatar_url: u.avatarUrl ?? undefined,
      })),
      tracks: raw.data.tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artwork_url: t.coverArtUrl ?? undefined,
        genre: undefined,
        artist_handle: undefined,
      })),
      playlists: raw.data.playlists.map((p) => ({
        id: p.id,
        title: p.title,
        cover_url: p.coverArtUrl ?? undefined,
      })),
    },
    meta: raw.data
      ? raw.meta
      : { current_page: 1, total_results: 0, total_pages: 0 },
  };
}

export const searchService = {
  async search({
    q,
    type = "all",
    page = 1,
    limit = 20,
  }: SearchParams): Promise<SearchResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockSearch({ q, type, page, limit });
    }

    const response = await api.get<BackendSearchResponse>("/discovery/search", {
      params: { q, type, page, limit },
    });

    return mapToSearchResponse(response.data);
  },
};