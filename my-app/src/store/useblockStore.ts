import { create } from "zustand";
import * as blockService from "@/src/services/blockService";

export interface BlockedUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  blockedAt: string;
}

interface BlockState {
  blockedUsers: BlockedUser[];
  loadingUserId: string | null;
  error: string | null;

  clearError: () => void;
  fetchBlockedUsers: () => Promise<void>;
  blockUser: (userId: string, userData?: { display_name?: string; handle?: string; avatar_url?: string }) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedUsers: [],
  loadingUserId: null,
  error: null,

  clearError: () => set({ error: null }),

  fetchBlockedUsers: async () => {
    try {
      const data = await blockService.getBlockedUsers();
      set({ blockedUsers: data.blockedUsers });
    } catch {
      set({ error: "Failed to load blocked users. Please try again." });
    }
  },

  blockUser: async (userId, userData) => {
    try {
      set({ loadingUserId: userId, error: null });
      const optimistic: BlockedUser = {
        id: userId,
        display_name: userData?.display_name ?? "",
        handle: userData?.handle ?? "",
        avatar_url: userData?.avatar_url ?? "",
        blockedAt: new Date().toISOString(),
      };
      set((state) => ({
        blockedUsers: [...state.blockedUsers.filter((u) => u.id !== userId), optimistic],
      }));
      await blockService.blockUser(userId);
      await get().fetchBlockedUsers();
    } catch {
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
        error: "Failed to block user. Please try again.",
      }));
    } finally {
      set({ loadingUserId: null });
    }
  },

  unblockUser: async (userId) => {
    const previous = get().blockedUsers;
    try {
      set({ loadingUserId: userId, error: null });
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
      }));
      await blockService.unblockUser(userId);
      await get().fetchBlockedUsers();
    } catch {
      set({ blockedUsers: previous, error: "Failed to unblock user. Please try again." });
    } finally {
      set({ loadingUserId: null });
    }
  },
}));