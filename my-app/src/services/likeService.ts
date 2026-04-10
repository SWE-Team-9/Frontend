import api from "./api";
import { TrackData, UserInteractionResponse } from "../types/interactions";

export interface LikeResponse {
  message: string;
  trackId: string;
  likesCount: number;
  liked: boolean;
}

export const likeTrack = async (trackId: string): Promise<LikeResponse> => {
  const response = await api.post(`/interactions/tracks/${trackId}/like`);
  return response.data;
};

export const unlikeTrack = async (trackId: string): Promise<LikeResponse> => {
  const response = await api.delete(`/interactions/tracks/${trackId}/like`);
  return response.data;
};

export const getUserLikes = async (userId: string): Promise<TrackData[]> => {
  const response = await api.get<UserInteractionResponse>(`/interactions/users/${userId}/likes`, {
    params: { page: 1, limit: 20 }
  });
  if (response.data && response.data.items) {
    return response.data.items.map((item: { track: TrackData; interactedAt: string }) => ({
      ...item.track,
      // Ensure the ID is mapped correctly for our stores
      id: item.track.id, 
      interactedAt: item.interactedAt,
      coverArt: item.track.coverArt || item.track.coverArtUrl,
      imageUrl: item.track.imageUrl || item.track.coverArtUrl
    }));
  }
  
  return [];
};