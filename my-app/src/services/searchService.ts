import api from "@/src/services/api";
import type { SearchResponse, SearchType } from "@/src/types/search";

interface SearchParams {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}

export const searchService = {
  async search({
    q,
    type = "all",
    page = 1,
    limit = 20,
  }: SearchParams): Promise<SearchResponse> {
    const response = await api.get<SearchResponse>("/discovery/search", {
      params: { q, type, page, limit },
    });
    return response.data;
  },
};
