import { create } from "zustand";
import * as blockService from "@/src/services/blockService"; //real 

// import * as blockService from "@/src/services/mockBlockService"; // testing

export interface BlockedUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  blockedAt: string;
}

interface BlockState {
  blockedUsers: BlockedUser[];
  loadingUserId: string | null; // ID of the user currently being blocked/unblocked

  fetchBlockedUsers: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedUsers: [],
  loadingUserId: null, 

  fetchBlockedUsers: async () => {
    try {
      const data = await blockService.getBlockedUsers();
      set({ blockedUsers: data.blockedUsers });
    } catch (error) {
      console.error(error);
    }
  },

  blockUser: async (userId) => {
    try {
      set({ loadingUserId: userId }); 
      await blockService.blockUser(userId);
      await get().fetchBlockedUsers();
    } catch (error) {
      console.error(error);
    } finally {
      set({ loadingUserId: null });
    }
  },

  unblockUser: async (userId) => {
    try {
      set({ loadingUserId: userId });
      await blockService.unblockUser(userId);
      await get().fetchBlockedUsers();
    } catch (error) {
      console.error(error);
    } finally {
      set({ loadingUserId: null }); 
    }
  },
}));