import { create } from "zustand";
import { likeTrack, unlikeTrack, getUserLikes } from "../services/likeService";
import { TrackData } from "../types/interactions";

type LikeStore = {
  likedTracks: TrackData[];
  loadingIds: string[];
  error: string | null;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: TrackData) => Promise<void>;
  fetchInitialLikes: (userId: string) => Promise<void>;
  clearError: () => void;
};

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedTracks: [],
  loadingIds: [],
  error: null,
  clearError: () => set({ error: null }),

  isLiked: (trackId) => get().likedTracks.some((t) => t.id === String(trackId)),

  fetchInitialLikes: async (userId) => {
    try {
      const data = await getUserLikes(userId);
      set({ likedTracks: data.items.map(item => item.track) });
    } catch (err) {
      console.error("Failed to load likes", err);
    }
  },

  toggleLike: async (track) => {
    const { likedTracks, loadingIds } = get();
    const trackId = String(track.id);
    const isAlreadyLiked = likedTracks.some((t) => t.id === trackId);

    if (loadingIds.includes(trackId)) return;

    set((state) => ({
      loadingIds: [...state.loadingIds, trackId],
      likedTracks: isAlreadyLiked
        ? state.likedTracks.filter((t) => t.id !== trackId)
        : [...state.likedTracks, { ...track, likesCount: (Number(track.likesCount) || 0) + 1 } as TrackData],
    }));

    try {
      const response = isAlreadyLiked ? await unlikeTrack(trackId) : await likeTrack(trackId);
      if (response && typeof response.likesCount === 'number') {
        set((state) => ({
          likedTracks: state.likedTracks.map((t) => 
            t.id === trackId ? { ...t, likesCount: response.likesCount } : t
          ),
        }));
      }
    } catch (error: unknown) {
      const err = error as {response?: { data?: { message?: string } }; message?: string};
      const msg = err.response?.data?.message || err.message || "Network Error";
      set((state) => ({
        likedTracks: isAlreadyLiked ? [...state.likedTracks, track] : state.likedTracks.filter((t) => t.id !== trackId),
        error: msg,
      }));
    } finally {
      set((state) => ({ loadingIds: state.loadingIds.filter((id) => id !== trackId) }));
    }
  },
}));