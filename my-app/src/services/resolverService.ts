import api from "@/src/services/api";
import type { ResolveResponse } from "@/src/types/resolver";

export const resolverService = {
  async resolve(permalink: string): Promise<ResolveResponse> {
    const response = await api.get<ResolveResponse>("/discovery/resolve", {
      params: { url: permalink },
    });
    return response.data;
  },
};