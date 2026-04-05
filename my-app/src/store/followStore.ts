import { create } from "zustand";
import {
  followUser,
  unfollowUser,
  getFollowing,
} from "@/src/services/socialService";
import { User } from "@/src/types/user";
import { useProfileStore } from "./useProfileStore";

type FollowStore = {
  following: User[];
  loadingIds: Record<string, boolean>;
  toggleFollow: (user: any) => Promise<void>;
  isFollowing: (userId: string | number | undefined) => boolean;
  fetchFollowing: (userId: string) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  loadingIds: {},

  // Fixed: Added optional chaining and null checks to prevent .toString() errors
  isFollowing: (userId) => {
    if (!userId) return false;
    return get().following.some((u) => 
      u?.id?.toString() === userId.toString()
    );
  },

  toggleFollow: async (user) => {
    if (!user || !user.id) return;

    const { following, loadingIds, isFollowing } = get();
    const alreadyFollowing = isFollowing(user.id);

    // Optimistic update
    if (alreadyFollowing) {
      set({
        following: following.filter((u) => u.id?.toString() !== user.id.toString()),
        loadingIds: { ...loadingIds, [user.id]: true },
      });
    } else {
      set({
        following: [...following, user],
        loadingIds: { ...loadingIds, [user.id]: true },
      });
    }

    try {
      if (!alreadyFollowing) {
        await followUser(user.id);
        const currentCount = useProfileStore.getState().followingCount;
    useProfileStore.setState({ followingCount: currentCount + 1 });
      } else {
        await unfollowUser(user.id);
        const currentCount = useProfileStore.getState().followingCount;
        useProfileStore.setState({ followingCount: Math.max(0, currentCount - 1) });
      }
    } catch (error) {
      console.error("Follow API error:", error);
      // Rollback
      set({
        following: alreadyFollowing
          ? [...following, user]
          : following.filter((u) => u.id?.toString() !== user.id.toString()),
      });
    } finally {
      set((state) => {
        const updated = { ...state.loadingIds };
        delete updated[user.id];
        return { loadingIds: updated };
      });
    }
  },

  fetchFollowing: async (userId) => {
    if (!userId) return;
    try {
      const data = await getFollowing(userId);

      const followingList = data.data?.following || [];
      
      useProfileStore.setState({ followingCount: followingList.length });
      // Standardized mapping to match UI expectations
      const mappedUsers: any[] = (followingList || []).map((u: any) => ({
        id: u.id,
        displayName: u.display_name || u.name || "Unknown",
        avatarUrl: u.avatar_url || u.avatar || null,
        followersCount: u.followers_count || 0,
        tracksCount: u.tracks_count || 0
      }));

      set({ following: mappedUsers });
    } catch (error) {
      console.error("Fetch following error:", error);
    }
  },
}));