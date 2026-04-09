import api from "./api"; // Adjust this path to point to your actual api.ts file

/**
 * Interface representing the backend response for a Like/Unlike action
 */
export interface LikeResponse {
  message: string;
  trackId: string;
  likesCount: number;
  liked: boolean;
}

/**
 * Sends a POST request to like a specific track.
 * Endpoint: POST /api/v1/interactions/tracks/{trackId}/like
 */
export const likeTrack = async (trackId: string | number): Promise<LikeResponse> => {
  const response = await api.post(`/interactions/tracks/${trackId}/like`);
  return response.data;
};

/**
 * Sends a DELETE request to remove a like from a specific track.
 * Endpoint: DELETE /api/v1/interactions/tracks/{trackId}/like
 */
export const unlikeTrack = async (trackId: string | number): Promise<LikeResponse> => {
  const response = await api.delete(`/interactions/tracks/${trackId}/like`);
  return response.data;
};