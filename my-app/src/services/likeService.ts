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
    params: { page: 1, limit: 50 } // Increased limit slightly for a better sidebar preview
  });

  if (response.data && response.data.items) {
    return response.data.items.map((item) => {
      const t = item.track;
      
      return {
        ...t,
        // 1. Force convert nulls to undefined to satisfy TS strict mode
        id: t.id,
        title: t.title || "Untitled Track",
        artistName: t.artistName ?? undefined,
        artistHandle: (t as { artistHandle?: string | null }).artistHandle ?? undefined,
        
        // 2. Normalize image URLs (handling multiple possible field names)
        coverArt: t.coverArt || t.coverArtUrl || t.imageUrl || undefined,
        imageUrl: t.imageUrl || t.coverArtUrl || t.coverArt || undefined,
        
        // 3. Metadata
        interactedAt: item.interactedAt,
        likesCount: t.likesCount ?? 0,
      } as TrackData;
    });
  }

  return [];
};