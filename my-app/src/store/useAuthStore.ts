import { create } from "zustand";

type AuthView = "login" | "signup" | "forgot" | "verify-email-notice";

interface AuthState { 
  email: string;
  isVerified: boolean | null; // null = unknown, true = verified, false = failed
  verificationToken: string | null;
  setEmail: (email: string) => void; // store email for resending verification
  setVerified: (status: boolean) => void; 
  setToken: (token: string) => void; // store token for verification
  resetVerification: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: "",
  isVerified: null,
  verificationToken: null,
  setEmail: (email) => set({ email }),
  setVerified: (status) => set({ isVerified: status }),
  setToken: (token) => set({ verificationToken: token }),
  resetVerification: () => set({ email: "", isVerified: null, verificationToken: null }),
}));