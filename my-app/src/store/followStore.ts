import { create } from "zustand";
import {
  followUser,
  unfollowUser,
  getFollowing,
  getSuggestions,
  SuggestedUser,
  FollowUser,
} from "@/src/services/followService";
import { useProfileStore } from "./useProfileStore";

type FollowStore = {
  following: FollowUser[];
  suggestions: SuggestedUser[];
  suggestionsLoading: boolean;
  loadingIds: Record<string, boolean>;
  toggleFollow: (user: FollowUser) => Promise<void>;
  isFollowing: (userId: string | number | undefined) => boolean;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  suggestions: [],
  suggestionsLoading: false,
  loadingIds: {},

  isFollowing: (userId) => {
    if (!userId) return false;
    return get().following.some(
      (u) => u?.id?.toString() === userId.toString(),
    );
  },

  toggleFollow: async (user) => {
    if (!user || !user.id) return;

    const { following, suggestions, loadingIds, isFollowing } = get();
    const alreadyFollowing = isFollowing(user.id);

    // Optimistic update: update following list and remove from suggestions if following
    if (alreadyFollowing) {
      set({
        following: following.filter((u) => u.id?.toString() !== user.id.toString()),
        loadingIds: { ...loadingIds, [user.id]: true },
      });
    } else {
      set({
        following: [...following, user],
        suggestions: suggestions.filter((u) => u.id?.toString() !== user.id.toString()),
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
      // Rollback on error
      set({
        following: alreadyFollowing
          ? [...following, user]
          : following.filter((u) => u.id?.toString() !== user.id.toString()),
           suggestions: alreadyFollowing
          ? suggestions
          : [...suggestions, user as SuggestedUser],
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
      const followingList = data.following || [];
      useProfileStore.setState({ followingCount: followingList.length });
      set({ following: followingList });
    } catch (error) {
      console.error("Fetch following error:", error);
    }
  },
  fetchSuggestions: async (limit = 3) => {
    set({ suggestionsLoading: true });
    try {
      const data = await getSuggestions(limit);
      // Filter out anyone already being followed
      const { isFollowing } = get();
      const filtered = (data.suggestions || []).filter(
        (u) => !isFollowing(u.id),
      );
      set({ suggestions: filtered });
    } catch (error) {
      console.error("Fetch suggestions error:", error);
    } finally {
      set({ suggestionsLoading: false });
    }
  },
}));
