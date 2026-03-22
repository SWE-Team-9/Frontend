import { create } from "zustand";

// ─────────────────────────────────────────────────────────────
// Auth Store
//
// WHY NO TOKENS?
//   Our backend uses httpOnly cookies for JWT tokens. The browser
//   handles sending them automatically — JavaScript cannot (and
//   should not) read them. So we only need to know:
//     1. Whether the user is logged in  (isAuthenticated)
//     2. Basic user info returned by the backend (user)
//     3. The email for the "verify email" flow
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

interface AuthState {
  // Current user data (null when logged out)
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Email kept separately for the "check your inbox" screen
  email: string | null;

  // Actions
  setUser: (user: AuthUser) => void;
  setEmail: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  email: null,

  setUser: (user) => set({ user, isAuthenticated: true, email: user.email }),

  setEmail: (email) => set({ email }),

  logout: () => set({ user: null, isAuthenticated: false, email: null }),
}));
