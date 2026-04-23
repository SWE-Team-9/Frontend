import api from "@/src/services/api";
import type { ResolveResponse } from "@/src/types/resolver";
import { mockResolve } from "@/src/services/mocks/discoveryMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const resolverService = {
  async resolve(permalink: string): Promise<ResolveResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockResolve(permalink);
    }
    const response = await api.get<ResolveResponse>("/discovery/resolve", {
      params: { url: permalink },
    });
    return response.data;
  },
};