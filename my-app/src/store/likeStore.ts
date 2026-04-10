import { create } from "zustand";
import { likeTrack, unlikeTrack, getUserLikes } from "../services/likeService";
import { TrackData } from "../types/interactions";

type LikeStore = {
  likedTracks: TrackData[];
  loadingIds: string[];
  error: string | null;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: TrackData) => Promise<void>;
  syncWithServer: (userId: string) => Promise<void>;
  clearError: () => void;
};

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedTracks: [],
  loadingIds: [],
  error: null,
  clearError: () => set({ error: null }),

  // Always compare as strings to avoid type mismatches
  isLiked: (trackId) => 
    get().likedTracks.some((t) => String(t.id) === String(trackId)),

  syncWithServer: async (userId) => {
    try {
      // The service now returns a flat TrackData[] array
      const tracks = await getUserLikes(userId);
      set({ likedTracks: tracks, error: null });
    } catch (err) {
      console.error("Sync failed", err);
    }
  },

  toggleLike: async (track) => {
    const { likedTracks, loadingIds, isLiked } = get();
    // Normalize the ID: use .id as the primary identifier
    const trackId = String('id' in track ? track.id : (track as { trackId?: string }).trackId);
    const isAlreadyLiked = isLiked(trackId);

    if (loadingIds.includes(trackId)) return;

    // --- STEP 1: OPTIMISTIC UPDATE ---
    set((state) => ({
      loadingIds: [...state.loadingIds, trackId],
      likedTracks: isAlreadyLiked
        ? state.likedTracks.filter((t) => String(t.id) !== trackId)
        : [...state.likedTracks, { ...track, id: trackId }], 
    }));

    try {
      // --- STEP 2: API CALL ---
      if (isAlreadyLiked) {
        await unlikeTrack(trackId);
      } else {
        await likeTrack(trackId);
      }
      // If successful, we keep the optimistic state
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      
      // --- STEP 3: SPECIAL CASE FOR 409 ---
      if (err.response?.status === 409) {
        // The server says "already liked", so our "Liked" state is actually correct.
        // We don't need to rollback, just keep the UI as is.
        console.warn("Server already in sync with this interaction.");
      } else {
        // --- STEP 4: ROLLBACK ON REAL ERROR ---
        const msg = err.response?.data?.message || err.message || "Network Error";
        set((state) => ({
          likedTracks: isAlreadyLiked 
            ? [...state.likedTracks, track] 
            : state.likedTracks.filter((t) => String(t.id) !== trackId),
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