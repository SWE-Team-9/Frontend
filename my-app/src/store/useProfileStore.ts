import { create } from 'zustand';

/**
 * ProfileState Interface
 * Defines the shape of the global profile store, including user data and action functions.
 */
interface ProfileState {
  // --- Data Properties ---
  displayName: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  bio: string;
  profileUrl: string;
  isPrivate: boolean;
  genre: string;
  accountTier: "Artist" | "Listener";
  links: { id: number; url: string; title: string }[];

  // --- Action Functions (Methods to update state) ---
  setProfileData: (data: Partial<ProfileState>) => void;
  
  /** Toggles the privacy mode between public and private */
  togglePrivate: () => void;
  
  addLink: () => void;
  
  removeLink: (id: number) => void;
  
  updateLink: (id: number, field: string, value: string) => void;
}

/**
 * useProfileStore
 * Global state management for the user profile using Zustand.
 */
export const useProfileStore = create<ProfileState>()((set) => ({
  // --- Initial State Values ---
  displayName: "Gehad mourad",
  firstName: "Gehad",
  lastName: "mourad",
  city: "",
  country: "Egypt",
  bio: "biomedical engineer",
  profileUrl: "gehad-mourad-904565429",
  isPrivate: false,
  accountTier: "Artist",
  genre: "None",
  links: [{ id: 1, url: '', title: '' }],

  // --- Action Implementations ---

  setProfileData: (data) => set((state) => ({ ...state, ...data })),

  togglePrivate: () => set((state) => ({ isPrivate: !state.isPrivate })),

  addLink: () => set((state) => ({ 
    links: [...state.links, { id: Date.now(), url: '', title: '' }] 
  })),

  removeLink: (id) => set((state) => ({
    links: state.links.filter((l) => l.id !== id)
  })),

  updateLink: (id, field, value) => set((state) => ({
    links: state.links.map((l) => l.id === id ? { ...l, [field]: value } : l)
  })),
}));