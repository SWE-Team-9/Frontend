import { create } from "zustand";
import { followUser, unfollowUser } from "@/src/services/followService";


interface User {
  id: number;
  name: string;
}


interface FollowStore {
  following: User[];
  loadingIds: Record<number, boolean>; 
  isFollowing: (userId: number) => boolean;
  toggleFollow: (user: User) => Promise<void>;
}

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: [],
  loadingIds: {}, 

  isFollowing: (userId) => get().following.some((u) => u.id === userId),

  toggleFollow: async (user) => {
    const { following, loadingIds } = get();
    
    
    if (loadingIds[user.id]) return;

    const isAlreadyFollowing = following.some((u) => u.id === user.id);

   
    set((state) => ({
      loadingIds: { ...state.loadingIds, [user.id]: true }, 
      following: isAlreadyFollowing
        ? state.following.filter((u) => u.id !== user.id)
        : [...state.following, user],
    }));

    try {
      if (isAlreadyFollowing) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
    } catch (error) {
      
      set((state) => ({
        following: isAlreadyFollowing
          ? [...state.following, user]
          : state.following.filter((u) => u.id !== user.id),
      }));
    } finally {
      
      set((state) => {
        const newLoadingIds = { ...state.loadingIds };
        delete newLoadingIds[user.id];
        return { loadingIds: newLoadingIds };
      });
    }
  },
}));