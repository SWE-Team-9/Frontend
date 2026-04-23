import api from "@/src/services/api";
import type { SearchResponse, SearchType } from "@/src/types/search";
import { mockSearch } from "@/src/services/mocks/discoveryMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockSearch({ q, type, page, limit });
    }
    const response = await api.get<SearchResponse>("/discovery/search", {
      params: { q, type, page, limit },
    });
    return response.data;
  },
};