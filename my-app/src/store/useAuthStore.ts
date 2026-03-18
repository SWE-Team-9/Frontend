import { create } from "zustand";

type AuthView = "login" | "signup" | "forgot" | "verify-email-notice";

interface AuthState {
  // (Email Verification Flow)
  email: string | null; // store email for verification and resending
  setEmail: (email: string) => void; // store email for resending verification

  // (JWT Handling)
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: null,
  setEmail: (email) => set({ email }),

  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }),

  clearTokens: () =>
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      email: null, // optional (depends on your flow)
    }),
    
}));
