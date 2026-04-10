import api from "./api";
import { UserInteractionResponse } from "../types/interactions";

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

export const getUserLikes = async (userId: string): Promise<UserInteractionResponse> => {
  const response = await api.get(`/interactions/users/${userId}/likes`, {
    params: { page: 1, limit: 20 }
  });
  return response.data;
};