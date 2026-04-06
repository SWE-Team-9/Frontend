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
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<void>;
};

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedTracks: [],
  loadingIds: [],

  isLiked: (trackId) => {
    return get().likedTracks.some((t) => t.id === trackId);
  },

  toggleLike: async (track) => {
    const { likedTracks, loadingIds } = get();
    const isAlreadyLiked = likedTracks.some((t) => t.id === track.id);

    if (loadingIds.includes(track.id)) return;

    // 🟢 Optimistic Update
    set({
      loadingIds: [...loadingIds, track.id],
      likedTracks: isAlreadyLiked
        ? likedTracks.filter((t) => t.id !== track.id)
        : [...likedTracks, { ...track, likesCount: (track.likesCount || 0) + 1 }],
    });

    try {
      // 🛠️ FIX: Convert string ID to Number for the service call
      const numericId = Number(track.id); 

      if (!isAlreadyLiked) {
        await likeTrack(numericId); 
      } else {
        await unlikeTrack(numericId);
      }
    } catch (error) {
      console.error("Like failed, rolling back state.");
      // 🔴 Rollback
      set((state) => ({
        likedTracks: isAlreadyLiked
          ? [...state.likedTracks, track]
          : state.likedTracks.filter((t) => t.id !== track.id),
      }));
    } finally {
      // ⚪ Clear loading
      set((state) => ({
        loadingIds: state.loadingIds.filter((id) => id !== track.id),
      }));
    }
  },
}));