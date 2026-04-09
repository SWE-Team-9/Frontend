import { create } from 'zustand';
import { repostService } from '@/src/services/repostService';

interface RepostStore {
  repostedTrackIds: Set<string>;
  loadingIds: Set<string>;
  // Helper to check state
  isReposted: (trackId: string) => boolean; 
  // Function to sync with backend on page load
  fetchReposts: () => Promise<void>; 
  toggleRepost: (trackId: string, isCurrentlyReposted: boolean) => Promise<void>;
}

export const useRepostStore = create<RepostStore>((set, get) => ({
  repostedTrackIds: new Set<string>(),
  loadingIds: new Set<string>(),

  // Helper function for cleaner component code
  isReposted: (trackId) => get().repostedTrackIds.has(String(trackId)),

  // New: Call this in a useEffect at the top level of your app or Profile
  fetchReposts: async () => {
    try {
      // You'll need this endpoint from your backend team eventually
      //const ids = await repostService.getRepostedIds(); 
      //set({ repostedTrackIds: new Set(ids) });
    } catch (error) {
      console.error("Failed to fetch user reposts:", error);
    }
  },

  toggleRepost: async (trackId, isCurrentlyReposted) => {
    const idStr = String(trackId);
    if (get().loadingIds.has(idStr)) return;

    set((state) => ({ 
      loadingIds: new Set(state.loadingIds).add(idStr) 
    }));

    try {
      const response = await repostService.toggleRepost(idStr, isCurrentlyReposted);
      
      set((state) => {
        const nextReposts = new Set(state.repostedTrackIds);
        // We use the response from the server as the "source of truth"
        if (response.reposted) {
          nextReposts.add(idStr);
        } else {
          nextReposts.delete(idStr);
        }
        return { repostedTrackIds: nextReposts };
      });

    } catch (error) {
      console.error("Repost API call failed:", error);
    } finally {
      set((state) => {
        const nextLoading = new Set(state.loadingIds);
        nextLoading.delete(idStr);
        return { loadingIds: nextLoading };
      });
    }
  },
}));