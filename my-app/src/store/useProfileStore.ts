import { create } from "zustand";

// ─────────────────────────────────────────────────────────────
// Profile Store
//
// Holds the current user's profile data. When the user visits
// /profile we fetch their data from the backend and put it here
// so every component can read it.
//
// BEGINNER TIP:
//   Think of this as a "global variable" that any React component
//   can read and update. Zustand makes sure React re-renders
//   automatically when the data changes.
// ─────────────────────────────────────────────────────────────

export interface SocialLink {
  id: number;          // local ID for the UI (so React can track list items)
  platform: string;    // e.g. "instagram", "youtube"
  url: string;
}

interface ProfileState {
  // ---- Data from the backend ----
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  accountType: "ARTIST" | "LISTENER";
  favoriteGenres: string[];
  links: SocialLink[];
  followersCount: number;
  followingCount: number;
  tracksCount: number;
  useMockData: boolean;

  // ---- Loading flag ----
  isLoaded: boolean;     // true once we fetched from the backend at least once

  // ---- Actions ----
  setProfileData: (data: Partial<ProfileState>) => void;
  resetProfile: () => void;
  togglePrivate: () => void;
  addLink: () => void;
  removeLink: (id: number) => void;
  updateLink: (id: number, field: string, value: string) => void;
}

const initialProfileState = {
  displayName: "Gehad Khamis",
  handle: "",
bio: "Biomedical Engineering Student",
  location: "",
  website: "",
  avatarUrl: null,
  coverUrl: null,
  isPrivate: false,
  accountType: "LISTENER" as const,
  favoriteGenres: [] as string[],
  links: [{ id: 1, platform: "", url: "" }],
  followersCount: 200,
  followingCount: 150,
  tracksCount: 5,
isLoaded: true,
  useMockData: true,
};

export const useProfileStore = create<ProfileState>()((set) => ({
  // Default / empty values
  ...initialProfileState,

  // ---- Action implementations ----

  setProfileData: (data) => set((state) => ({ ...state, ...data })),

  resetProfile: () => set(initialProfileState),

  togglePrivate: () => set((state) => ({ isPrivate: !state.isPrivate })),

  addLink: () =>
    set((state) => ({
      links: [...state.links, { id: Date.now(), platform: "", url: "" }],
    })),

  removeLink: (id) =>
    set((state) => ({
      links: state.links.filter((l) => l.id !== id),
    })),

  updateLink: (id, field, value) =>
    set((state) => ({
      links: state.links.map((l) =>
        l.id === id ? { ...l, [field]: value } : l,
      ),
    })),
}));