import { create } from "zustand";
import { likeTrack, unlikeTrack } from "@/src/services/likeService";

export type Track = {
  id: string; // We keep this as string to match your UI props
  title: string;
  likesCount: number;
  artistName?: string; // Added
  coverArt?: string;   // Added
  imageUrl?: string;
};

type LikeStore = {
  likedTracks: Track[];
  loadingIds: string[];
  error: string | null;
  clearError: () => void;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<void>;
};

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedTracks: [],
  loadingIds: [],
  error: null,
  clearError: () => set({ error: null }),

  isLiked: (trackId) => {
    return get().likedTracks.some((t) => t.id === trackId);
  },

  toggleLike: async (track) => {
    const { likedTracks, loadingIds } = get();
    const trackIdStr = String(track.id);
    const isAlreadyLiked = likedTracks.some((t) => t.id === track.id);

    if (loadingIds.includes(track.id)) return;
    set({
      loadingIds: [...loadingIds, track.id],
      likedTracks: isAlreadyLiked
        ? likedTracks.filter((t) => t.id !== track.id)
        : [...likedTracks, { ...track, likesCount: (track.likesCount || 0) + 1 }],
    });

    try {
      // Convert string ID to Number for the service call
      const numericId = track.id; 

      if (!isAlreadyLiked) {
        await likeTrack(numericId); 
      } else {
        await unlikeTrack(numericId);
      }
    } catch (error) {
      console.error("Like failed, rolling back state.");
   
      set((state) => ({
        likedTracks: isAlreadyLiked
          ? [...state.likedTracks, track]
          : state.likedTracks.filter((t) => t.id !== track.id),
        error: "Could not update like state. Please try again.",
      }));
    } finally {
      set((state) => ({
        loadingIds: state.loadingIds.filter((id) => id !== track.id),
      }));
    }
  },
}));