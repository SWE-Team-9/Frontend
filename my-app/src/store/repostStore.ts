import { create } from 'zustand';

interface RepostStore {
  repostedTrackIds: Set<string>;
  hydrate: () => void;
  toggleRepost: (trackId: string, isCurrentlyReposted: boolean) => Promise<void>;
}

export const useRepostStore = create<RepostStore>((set, get) => ({
  repostedTrackIds: new Set<string>(),

  hydrate: () => {
    const stored = localStorage.getItem("mock_reposts");
    if (stored) {
      set({ repostedTrackIds: new Set(JSON.parse(stored)) });
    }
  },

  toggleRepost: async (trackId, isCurrentlyReposted) => {
    const { repostedTrackIds } = get();
    const newReposts = new Set(repostedTrackIds);
    const idStr = String(trackId);

    if (isCurrentlyReposted) {
      newReposts.delete(idStr);
    } else {
      newReposts.add(idStr);
    }

    // Update Local State
    set({ repostedTrackIds: newReposts });
    
    // Update Mock Storage
    localStorage.setItem("mock_reposts", JSON.stringify(Array.from(newReposts)));
  },
}));