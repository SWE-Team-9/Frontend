import { create } from "zustand";
import { repostTrack, removeRepost, getUserReposts, RepostResponse } from "../services/repostService";
import { TrackData } from "../types/interactions";

type RepostStore = {
  repostedTracks: TrackData[];
  loadingIds: string[];
  error: string | null;
  isReposted: (trackId: string) => boolean; // Must match the name in implementation
  toggleRepost: (track: TrackData) => Promise<void>;
  fetchInitialReposts: (userId: string) => Promise<void>;
  clearError: () => void;
};

export const useRepostStore = create<RepostStore>((set, get) => ({
  repostedTracks: [],
  loadingIds: [],
  error: null,
  clearError: () => set({ error: null }),

  // FIX: Renamed from isLiked to isReposted to match the Type definition
  isReposted: (trackId) => get().repostedTracks.some((t) => t.id === String(trackId)),

  fetchInitialReposts: async (userId) => {
    try {
      const data = await getUserReposts(userId);
      set({ repostedTracks: data.items.map(item => item.track) });
    } catch (err) {
      console.error("Failed to load reposts", err);
    }
  },

  toggleRepost: async (track) => {
    const { repostedTracks, loadingIds } = get();
    const trackId = String(track.id);
    const isAlreadyReposted = repostedTracks.some((t) => t.id === trackId);

    if (loadingIds.includes(trackId)) return;

    // STEP A: OPTIMISTIC UPDATE
    set((state) => ({
      loadingIds: [...state.loadingIds, trackId],
      repostedTracks: isAlreadyReposted
        ? state.repostedTracks.filter((t) => t.id !== trackId)
        : [...state.repostedTracks, { 
            ...track, 
            repostsCount: (Number(track.repostsCount) || 0) + 1 
          } as TrackData],
    }));

    try {
      // STEP B: API CALL
      const response: RepostResponse = isAlreadyReposted 
        ? await removeRepost(trackId) 
        : await repostTrack(trackId);

      // STEP C: SUCCESS SYNC
      if (response && typeof response.repostsCount === 'number') {
        set((state) => ({
          repostedTracks: state.repostedTracks.map((t) => 
            t.id === trackId ? { ...t, repostsCount: response.repostsCount } : t
          ),
        }));
      }
    } catch (error: unknown) {
      const err = error as {response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || "Network Error";
      // STEP D: ROLLBACK
      set((state) => ({
    repostedTracks: isAlreadyReposted 
      ? [...state.repostedTracks, track] 
      : state.repostedTracks.filter((t) => t.id !== trackId),
    error: msg,
  }));
    } finally {
      // STEP E: REMOVE LOADING STATE
      set((state) => ({ 
        loadingIds: state.loadingIds.filter((id) => id !== trackId) 
      }));
    }
  },
}));