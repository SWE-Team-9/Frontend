import { create } from "zustand";
import { likeTrack, unlikeTrack } from "@/src/services/likeService";

export type Track = {
  id: number;
  title: string;
  likesCount: number;
};

type LikeStore = {
  likedTracks: Track[];
  loadingIds: number[];
  isLiked: (trackId: number) => boolean;
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

    // 🛡️ Prevent multiple clicks while one is processing
    if (loadingIds.includes(track.id)) return;

    // 🟢 Optimistic Update
    set({
      loadingIds: [...loadingIds, track.id],
      likedTracks: isAlreadyLiked
        ? likedTracks.filter((t) => t.id !== track.id)
        : [...likedTracks, { ...track, likesCount: track.likesCount + 1 }],
    });

    try {
      if (!isAlreadyLiked) {
        await likeTrack(track.id);
      } else {
        await unlikeTrack(track.id);
      }
    } catch (error) {
      // 🔴 Rollback on Failure
      console.error("Like failed, rolling back state.");
      set((state) => ({
        likedTracks: isAlreadyLiked
          ? [...state.likedTracks, track]
          : state.likedTracks.filter((t) => t.id !== track.id),
      }));
    } finally {
      // ⚪ Clear loading state
      set((state) => ({
        loadingIds: state.loadingIds.filter((id) => id !== track.id),
      }));
    }
  },
}));