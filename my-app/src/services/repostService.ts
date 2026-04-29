import api from "./api";
import { TrackData, UserInteractionResponse } from "../types/interactions";
import {
  TrackInteractionNotificationMeta,
  triggerTrackInteractionNotification,
} from "@/src/services/interactionNotificationService";

export interface RepostResponse {
  message: string;
  trackId: string;
  repostsCount: number;
  reposted: boolean;
}

export const repostTrack = async (
  trackId: string,
  notificationMeta?: TrackInteractionNotificationMeta,
): Promise<RepostResponse> => {
  const response = await api.post(`/interactions/tracks/${trackId}/repost`);

  triggerTrackInteractionNotification("repost", trackId, notificationMeta);

  return response.data;
};

export const removeRepost = async (trackId: string): Promise<RepostResponse> => {
  const response = await api.delete(`/interactions/tracks/${trackId}/repost`);
  return response.data;
};

export const getUserReposts = async (userId: string): Promise<TrackData []> => {
  const response = await api.get(`/interactions/users/${userId}/reposts`, {
    params: { page: 1, limit: 20 }
  });
  if (response.data && response.data.items) {
    return response.data.items.map((item: { track: TrackData; interactedAt: string }) => ({
      ...item.track,
      // Ensure the ID is mapped correctly for our stores
      id: item.track.id, 
      interactedAt: item.interactedAt,
    }));
  }
  
  return [];
};