import { create } from "zustand";
import {
  followUser,
  unfollowUser,
  getFollowing,
} from "@/src/services/followService";
import { User } from "@/src/types/user";

// User type (matches backend)


//  Store type
type FollowStore = {
  following: User[];
  loadingIds: Record<string, boolean>;

  toggleFollow: (user: User) => Promise<void>;
  isFollowing: (userId: string) => boolean;

  fetchFollowing: (userId: string) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  loadingIds: {},

  // Check if user is followed
  isFollowing: (userId) =>
    get().following.some((u) => u.id === userId),

  // Follow / Unfollow with optimistic UI
  toggleFollow: async (user) => {
    const { following, loadingIds, isFollowing } = get();

    const alreadyFollowing = isFollowing(user.id);

    // Optimistic update (instant UI response)
    if (alreadyFollowing) {
      set({
        following: following.filter((u) => u.id !== user.id),
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
      } else {
        await unfollowUser(user.id);
      }
    } catch (error) {
      console.error("Follow API error:", error);

      // Rollback if API fails
      set({
        following: alreadyFollowing
          ? [...following, user]
          : following.filter((u) => u.id !== user.id),
      });
    } finally {
      // Remove loading state
      set((state) => {
        const updated = { ...state.loadingIds };
        delete updated[user.id];
        return { loadingIds: updated };
      });
    }
  },

  // Fetch real following list from backend
  fetchFollowing: async (userId) => {
    try {
      const data = await getFollowing(userId);

      const mappedUsers: User[] = data.following.map((u: any) => ({
        id: u.id,
        name: u.display_name,
        avatar: u.avatar_url,
      }));

      set({ following: mappedUsers });
    } catch (error) {
      console.error("Fetch following error:", error);
    }
  },
}));
