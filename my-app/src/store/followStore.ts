import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
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
  profileFollowing: FollowUser[];
  profileFollowers: FollowUser[];
  activeProfileUserId: string | null;
  suggestions: SuggestedUser[];
  suggestionsLoading: boolean;
  loadingIds: Record<string, boolean>;
  error: string | null;
  clearError: () => void;
  setActiveProfileUser: (userId: string | null) => void;
  toggleFollow: (user: FollowUser) => Promise<void>;
  isFollowing: (userId: string | number | undefined) => boolean;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  followers: [],
  profileFollowing: [],
  profileFollowers: [],
  activeProfileUserId: null,
  suggestions: [],
  suggestionsLoading: false,
  loadingIds: {},
  error: null,
  clearError: () => set({ error: null }),
  setActiveProfileUser: (userId) => set({ activeProfileUserId: userId }),

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
      const authUserId = useAuthStore.getState().user?.id;
      const viewedProfileId = useProfileStore.getState().userId;

      if (!alreadyFollowing) {
        await followUser(user.id);
        if (authUserId && viewedProfileId === authUserId) {
          const currentCount = useProfileStore.getState().followingCount;
          useProfileStore.setState({ followingCount: currentCount + 1 });
        }
        if (
          viewedProfileId &&
          user.id?.toString() === viewedProfileId.toString() &&
          viewedProfileId !== authUserId
        ) {
          const currentFollowers = useProfileStore.getState().followersCount;
          useProfileStore.setState({ followersCount: currentFollowers + 1 });
        }
      } else {
        await unfollowUser(user.id);
        if (authUserId && viewedProfileId === authUserId) {
          const currentCount = useProfileStore.getState().followingCount;
          useProfileStore.setState({ followingCount: Math.max(0, currentCount - 1) });
        }
        if (
          viewedProfileId &&
          user.id?.toString() === viewedProfileId.toString() &&
          viewedProfileId !== authUserId
        ) {
          const currentFollowers = useProfileStore.getState().followersCount;
          useProfileStore.setState({ followersCount: Math.max(0, currentFollowers - 1) });
        }
      }
    } catch {
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

      const currentUserId = useAuthStore.getState().user?.id;
      const activeProfileUserId = get().activeProfileUserId;

      if (userId === currentUserId) {
        set({ following: followingList });
      }

      if (activeProfileUserId === userId) {
        set({ profileFollowing: followingList });
      }
    } catch {
      set({ error: "Could not load following list." });
    }
  },

  fetchFollowers: async (userId) => {
    if (!userId) return;
    try {
      set({ error: null });
      const data = await getFollowers(userId);
      const followersList = data.followers || [];

      const currentUserId = useAuthStore.getState().user?.id;
      const activeProfileUserId = get().activeProfileUserId;

      if (userId === currentUserId) {
        set({ followers: followersList });
      }

      if (activeProfileUserId === userId) {
        set({ profileFollowers: followersList });
      }
    } catch {
      set({ error: "Could not load followers list." });
    }
  },

  fetchSuggestions: async (limit = 3) => {
    set({ suggestionsLoading: true, error: null });
    try {
      const data = await getSuggestions(limit);
      const { isFollowing } = get();
      const filtered = (data.suggestions || []).filter(
        (u) => !isFollowing(u.id) && (!u.accountType || u.accountType === "ARTIST")
      );
      set({ suggestions: filtered });
    } catch {
      set({ error: "Could not load suggested artists." });
    } finally {
      set({ suggestionsLoading: false });
    }
  },
}));