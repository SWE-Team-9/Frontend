import api from "./api";
import { FollowUser } from "@/src/services/followService";

interface BackendUser {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  handle?: string; 
}

interface InteractionItem {
  interactedAt: string;
  user: BackendUser;
}

export const getTrackEngagements = async (
  trackId: string, 
  type: 'likes' | 'reposts'
): Promise<FollowUser[]> => {
  const endpoint = type === 'likes' ? 'likers' : 'reposters';

  const response = await api.get(`/interactions/tracks/${trackId}/${endpoint}`);

  
  const items = response.data.items || [];


  return items.map((item: InteractionItem) => ({
    id: item.user.userId,
    display_name: item.user.displayName,
    
    handle: item.user.handle || item.user.displayName.toLowerCase().replace(/\s+/g, ''),
    avatar_url: item.user.avatarUrl || "", 
  }));
};