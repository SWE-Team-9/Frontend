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
    options?: {
      syncProfileList?: boolean;
      page?: number;
      limit?: number;
    }
  ) => Promise<void>;
  fetchFollowers: (
    userId: string,
    options?: { 
      syncProfileList?: boolean;
      page?: number;
      limit?: number;
    }
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
    
    // START: PAGINATION PARAMS
    // Extract page and limit from options to support independent page loading
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    // END: PAGINATION PARAMS

    try {
      set({ error: null });
      
      // Fetching data from service with pagination support
      const data = await getFollowing(userId, page, limit);
      const followingList = data.following || [];
      const profileState = useProfileStore.getState();
      const isActiveProfile = profileState.userId === userId;

      if (syncProfileList && isActiveProfile && typeof data.total === "number") {
        useProfileStore.setState({ followingCount: data.total });
      }

      const currentUserId = useAuthStore.getState().user?.id;
      const nextState: Partial<FollowStore> = {};

      if (userId === currentUserId) {
        nextState.following = followingList;
      }

      if (syncProfileList && isActiveProfile) {
        // Replacing the list with the current page's data for clean navigation
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

    // 1. Extract page and limit from options for pagination support
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    try {
      set({ error: null });

      // 2. Pass pagination parameters to the API service
      const data = await getFollowers(userId, page, limit);
      const followersList = data.followers || [];
      const profileState = useProfileStore.getState();
      const isActiveProfile = profileState.userId === userId;

      // Update total count in profile store to stay synced with backend
      if (syncProfileList && isActiveProfile && typeof data.total === "number") {
        useProfileStore.setState({ followersCount: data.total });
      }

      const currentUserId = useAuthStore.getState().user?.id;
      const nextState: Partial<FollowStore> = {};

      // Update main followers list if it's the current user's profile
      if (userId === currentUserId) {
        nextState.followers = followersList;
      }

      // 3. Replace the list with new page data for clean independent pagination
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