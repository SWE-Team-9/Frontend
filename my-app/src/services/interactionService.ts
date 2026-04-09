import api from "./api";
import { FollowUser } from "@/src/services/followService";

// We use FollowUser directly to ensure total project sync
export const getTrackEngagements = async (
  trackId: string, 
  type: 'likes' | 'reposts'
): Promise<FollowUser[]> => {
  const endpoint = type === 'likes' ? 'likers' : 'reposters';

  const response = await api.get(`/interactions/tracks/${trackId}/${endpoint}`);
  
  // Mapping backend response to the FollowUser interface
  return response.data.users.map((u: unknown) => ({
    id: (u as { id: string }).id,
    display_name: (u as { display_name: string }).display_name, // Mapping to match FollowUser
    handle: (u as { handle: string }).handle,
    avatar_url: (u as { avatar_url: string }).avatar_url || "", // Mapping to match FollowUser
  }));
};