import { create } from "zustand";
import { repostTrack, removeRepost, getUserReposts, RepostResponse } from "../services/repostService";
import { TrackData } from "../types/interactions";

type RepostStore = {
  repostedTracks: TrackData[];
  loadingIds: string[];
  error: string | null;
  isReposted: (trackId: string) => boolean;
  toggleRepost: (track: TrackData) => Promise<void>;
  deleteRepostAction: (trackId: string) => Promise<void>;
  syncWithServer: (userId: string) => Promise<void>; // Renamed for consistency
  clearError: () => void;
};

export const useRepostStore = create<RepostStore>((set, get) => ({
  repostedTracks: [],
  loadingIds: [],
  error: null,
  clearError: () => set({ error: null }),

  isReposted: (trackId) => 
    get().repostedTracks.some((t) => String(t.id) === String(trackId)),

  

  syncWithServer: async (userId) => {
    try {
      // service now returns the flat TrackData[]
      const tracks = await getUserReposts(userId);
      set({ repostedTracks: tracks, error: null });
    } catch (err) {
      console.error("Failed to sync reposts", err);
    }
  },
  
 // Add this action inside useRepostStore
deleteRepostAction: async (trackId: string) => {
  const idStr = String(trackId);
  if (!idStr || idStr === "undefined") return;
  // 1. Optimistic Remove
  set((state) => ({
    repostedTracks: state.repostedTracks.filter((t) => String(t.id) !== idStr),
    loadingIds: [...state.loadingIds, idStr]
  }));

  try {
    await removeRepost(idStr); // The DELETE call
  } catch (err) {
    console.error("Delete failed, rolling back", err);
    // Optional: Re-fetch or rollback state here
  } finally {
      set((state) => ({
        loadingIds: state.loadingIds.filter((id) => id !== idStr)
      }));
    }
},
  
  toggleRepost: async (track) => {
    const { repostedTracks, loadingIds, isReposted } = get();
    // Support both ID formats and force string type
    const trackId = String('id' in track ? track.id : (track as { trackId?: string }).trackId);
    const isAlreadyReposted = isReposted(trackId);

    if (loadingIds.includes(trackId)) return;

    // --- STEP A: OPTIMISTIC UPDATE ---
    set((state) => ({
      loadingIds: [...state.loadingIds, trackId],
      repostedTracks: isAlreadyReposted
        ? state.repostedTracks.filter((t) => String(t.id) !== trackId)
        : [...state.repostedTracks, { 
            ...track, 
            id: trackId,
            repostsCount: (Number(track.repostsCount) || 0) + 1 
          } as TrackData],
    }));

    try {
      // --- STEP B: API CALL ---
      const response: RepostResponse = isAlreadyReposted 
        ? await removeRepost(trackId) 
        : await repostTrack(trackId, {
            trackTitle: track.title,
            targetUserId: track.artistId,
          });

      // --- STEP C: SUCCESS SYNC ---
      if (response && typeof response.repostsCount === 'number') {
        set((state) => ({
          repostedTracks: state.repostedTracks.map((t) => 
            String(t.id) === trackId ? { ...t, repostsCount: response.repostsCount } : t
          ),
        }));
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      
      // --- STEP D: HANDLE 409 CONFLICT ---
      if (err.response?.status === 409) {
        // Server and UI are already in sync (e.g., already reposted)
        console.warn("Repost state already exists on server.");
      } else {
        // --- STEP E: ACTUAL ROLLBACK ---
        const msg = err.response?.data?.message || err.message || "Network Error";
        set((state) => ({
          repostedTracks: isAlreadyReposted 
            ? [...state.repostedTracks, track] 
            : state.repostedTracks.filter((t) => String(t.id) !== trackId),
          error: msg,
        }));
      }
    } finally {
      set((state) => ({ 
        loadingIds: state.loadingIds.filter((id) => id !== trackId) 
      }));
    }
  },
}));