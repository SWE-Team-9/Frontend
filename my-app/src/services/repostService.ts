// src/services/repostService.ts
import api from "./api";

const REPOST_STORAGE_KEY = "mock_reposts";

export const repostService = {
  // Mock: Get all IDs the user has reposted
  getRepostedIds: async (): Promise<string[]> => {
    const stored = localStorage.getItem(REPOST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Mock: Toggle Repost (Will be replaced by POST/DELETE /api/v1/...)
  toggleRepost: async (trackId: string, isReposted: boolean) => {
    const stored = localStorage.getItem(REPOST_STORAGE_KEY);
    let ids: string[] = stored ? JSON.parse(stored) : [];

    if (isReposted) {
      ids = ids.filter(id => id !== trackId);
    } else {
      ids.push(trackId);
    }

    localStorage.setItem(REPOST_STORAGE_KEY, JSON.stringify(ids));
    
    // Logic for when backend is ready:
    // if (isReposted) return api.delete(`/interactions/tracks/${trackId}/repost`);
    // return api.post(`/interactions/tracks/${trackId}/repost`);
    
    return { success: true, reposted: !isReposted };
  },

  // Mock: Fetch tracks that match the reposted IDs
  getRepostedTracks: async (allTracks: any[]) => {
    const repostedIds = await repostService.getRepostedIds();
    return allTracks.filter(track => repostedIds.includes(track.trackId || track.id));
  }
};