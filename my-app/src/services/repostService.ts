import api from "./api";
import { UserInteractionResponse } from "../types/interactions";

export interface RepostResponse {
  message: string;
  trackId: string;
  repostsCount: number;
  reposted: boolean;
}

export const repostTrack = async (trackId: string): Promise<RepostResponse> => {
  const response = await api.post(`/interactions/tracks/${trackId}/repost`);
  return response.data;
};

export const removeRepost = async (trackId: string): Promise<RepostResponse> => {
  const response = await api.delete(`/interactions/tracks/${trackId}/repost`);
  return response.data;
};

export const getUserReposts = async (userId: string): Promise<UserInteractionResponse> => {
  const response = await api.get(`/interactions/users/${userId}/reposts`, {
    params: { page: 1, limit: 20 }
  });
  return response.data;
};