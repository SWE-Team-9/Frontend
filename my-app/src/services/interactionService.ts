import api from "./api";
import { FollowUser } from "@/src/services/followService";

interface BackendUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
}
// We use FollowUser directly to ensure total project sync
export const getTrackEngagements = async (
  trackId: string, 
  type: 'likes' | 'reposts'
): Promise<FollowUser[]> => {
  const endpoint = type === 'likes' ? 'likers' : 'reposters';

  const response = await api.get(`/interactions/tracks/${trackId}/${endpoint}`);

  const users = response.data.users || [];
  // Mapping backend response to the FollowUser interface
  return users.map((u:BackendUser) => ({
    id: u.id,
    display_name: u.display_name,
    handle: u.handle,
    avatar_url: u.avatar_url || "", 
  }));
};