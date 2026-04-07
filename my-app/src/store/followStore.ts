import { create } from "zustand";
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getSuggestions,
  SuggestedUser,
  FollowUser,
} from "@/src/services/followService";
import { useProfileStore } from "./useProfileStore";

type FollowStore = {
  following: FollowUser[];
  followers: FollowUser[];
  suggestions: SuggestedUser[];
  suggestionsLoading: boolean;
  loadingIds: Record<string, boolean>;
  error: string | null;
  clearError: () => void;
  toggleFollow: (user: FollowUser) => Promise<void>;
  isFollowing: (userId: string | number | undefined) => boolean;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  followers: [],
  suggestions: [],
  suggestionsLoading: false,
  loadingIds: {},
  error: null,
  clearError: () => set({ error: null }),

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

    set({ error: null });

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
    } catch {
      // Rollback on error
      set({
        following: alreadyFollowing
          ? [...following, user]
          : following.filter((u) => u.id?.toString() !== user.id.toString()),
           suggestions: alreadyFollowing
          ? suggestions
          : [...suggestions, user as SuggestedUser],
        error: "Could not update follow status. Please try again.",
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
      set({ error: null });
      const data = await getFollowing(userId);
      const followingList = data.following || [];
      useProfileStore.setState({ followingCount: followingList.length });
      set({ following: followingList });
    } catch {
      set({ error: "Could not load following list." });
    }
  },
  //Menna

  fetchFollowers: async (userId) => {
    if (!userId) return;
    try {
      set({ error: null });
      const data = await getFollowers(userId);
      const followersList = data.followers || [];
      useProfileStore.setState({ followersCount: followersList.length });
      set({ followers: followersList });
    } catch {
      set({ error: "Could not load followers list." });
    }
  },

  fetchSuggestions: async (limit = 3) => {
    set({ suggestionsLoading: true, error: null });
    try {
      const data = await getSuggestions(limit);
      // Filter out anyone already being followed
      const { isFollowing } = get();
      const filtered = (data.suggestions || []).filter(
        (u) => !isFollowing(u.id),
      );
      set({ suggestions: filtered });
    } catch {
      set({ error: "Could not load suggested artists." });
    } finally {
      set({ suggestionsLoading: false });
    }
  },
}));
