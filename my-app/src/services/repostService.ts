import api from "./api";

export interface RepostResponse {
  message: string;
  trackId: string;
  repostsCount?: number; // Only returned on POST
  reposted: boolean;
}

export const repostService = {
  /**
   * Toggles the repost state by calling the backend.
   * Method: POST for creating, DELETE for removing.
   */
  toggleRepost: async (trackId: string, isCurrentlyReposted: boolean): Promise<RepostResponse> => {
    if (isCurrentlyReposted) {
      // DELETE /api/v1/interactions/tracks/{trackId}/repost
      const response = await api.delete(`/interactions/tracks/${trackId}/repost`);
      return response.data;
    } else {
      // POST /api/v1/interactions/tracks/{trackId}/repost
      const response = await api.post(`/interactions/tracks/${trackId}/repost`);
      return response.data;
    }
  },

  /**
   * Note: For 'getRepostedTracks', you will eventually want a real 
   * GET endpoint like /api/v1/me/reposts instead of filtering local arrays.
   */
  getRepostedTracks: async () => {
    // This should be updated once your backend team provides 
    // an endpoint to fetch the user's reposted collection.
    const response = await api.get(`/interactions/reposts`); 
    return response.data;
  },
};