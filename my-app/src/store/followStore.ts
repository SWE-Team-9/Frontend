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
  suggestions: SuggestedUser[];
  suggestionsLoading: boolean;
  loadingIds: Record<string, boolean>;
  error: string | null;
  clearError: () => void;
  toggleFollow: (user: FollowUser) => Promise<void>;
  isFollowing: (userId: string | number | undefined) => boolean;
  fetchFollowing: (
    userId: string,
    options?: { syncProfileList?: boolean },
  ) => Promise<void>;
  fetchFollowers: (
    userId: string,
    options?: { syncProfileList?: boolean },
  ) => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  followers: [],
  profileFollowing: [],
  profileFollowers: [],
  suggestions: [],
  suggestionsLoading: false,
  loadingIds: {},
  error: null,
  clearError: () => set({ error: null }),

  isFollowing: (userId) => {
    if (!userId) return false;
    return get().following.some((u) => u?.id?.toString() === userId.toString());
  },

  toggleFollow: async (user) => {
    if (!user || !user.id) return;

    const { following, suggestions, loadingIds, isFollowing } = get();
    const alreadyFollowing = isFollowing(user.id);

    set({ error: null });

    if (alreadyFollowing) {
      set({
        following: following.filter(
          (u) => u.id?.toString() !== user.id.toString(),
        ),
        loadingIds: { ...loadingIds, [user.id]: true },
      });
    } else {
      set({
        following: [...following, user],
        suggestions: suggestions.filter(
          (u) => u.id?.toString() !== user.id.toString(),
        ),
        loadingIds: { ...loadingIds, [user.id]: true },
      });
    }

    try {
      if (!alreadyFollowing) {
        await followUser(user.id);

        const profileState = useProfileStore.getState();
        const activeProfileUserId = profileState.userId;
        const currentUserId = useAuthStore.getState().user?.id;

        if (activeProfileUserId && activeProfileUserId === currentUserId) {
          useProfileStore.setState({
            followingCount: profileState.followingCount + 1,
          });
        } else if (activeProfileUserId && activeProfileUserId === user.id) {
          useProfileStore.setState({
            followersCount: profileState.followersCount + 1,
          });
        }
      } else {
        await unfollowUser(user.id);

        const profileState = useProfileStore.getState();
        const activeProfileUserId = profileState.userId;
        const currentUserId = useAuthStore.getState().user?.id;

        if (activeProfileUserId && activeProfileUserId === currentUserId) {
          useProfileStore.setState({
            followingCount: Math.max(0, profileState.followingCount - 1),
          });
        } else if (activeProfileUserId && activeProfileUserId === user.id) {
          useProfileStore.setState({
            followersCount: Math.max(0, profileState.followersCount - 1),
          });
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

  fetchFollowing: async (userId, options) => {
    if (!userId) return;

    const syncProfileList = options?.syncProfileList ?? true;

    try {
      set({ error: null });
      const data = await getFollowing(userId);
      const followingList = data.following || [];
      const profileState = useProfileStore.getState();
      const isActiveProfile = profileState.userId === userId;

      // Keep profile counts aligned with server totals (avoid page-size list lengths)
      if (syncProfileList && isActiveProfile && typeof data.total === "number") {
        useProfileStore.setState({ followingCount: data.total });
      }

      const currentUserId = useAuthStore.getState().user?.id;
      const nextState: Partial<FollowStore> = {};

      if (userId === currentUserId) {
        nextState.following = followingList;
      }

      // Prevent stale profile bleed from unrelated fetches (e.g., player refresh)
      if (syncProfileList && isActiveProfile) {
        nextState.profileFollowing = followingList;
      }

      if (Object.keys(nextState).length > 0) {
        set(nextState);
      }
    } catch {
      set({ error: "Could not load following list." });
    }
  },

  fetchFollowers: async (userId, options) => {
    if (!userId) return;

    const syncProfileList = options?.syncProfileList ?? true;

    try {
      set({ error: null });
      const data = await getFollowers(userId);
      const followersList = data.followers || [];
      const profileState = useProfileStore.getState();
      const isActiveProfile = profileState.userId === userId;

      // Keep profile counts aligned with server totals (avoid page-size list lengths)
      if (syncProfileList && isActiveProfile && typeof data.total === "number") {
        useProfileStore.setState({ followersCount: data.total });
      }

      const currentUserId = useAuthStore.getState().user?.id;
      const nextState: Partial<FollowStore> = {};

      if (userId === currentUserId) {
        nextState.followers = followersList;
      }

      // Prevent stale profile bleed when navigating between profiles quickly
      if (syncProfileList && isActiveProfile) {
        nextState.profileFollowers = followersList;
      }

      if (Object.keys(nextState).length > 0) {
        set(nextState);
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
        (u) =>
          !isFollowing(u.id) && (!u.accountType || u.accountType === "ARTIST"),
      );
      set({ suggestions: filtered });
    } catch {
      set({ error: "Could not load suggested artists." });
    } finally {
      set({ suggestionsLoading: false });
    }
  },
}));
