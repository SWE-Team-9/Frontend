import api from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";

// ─────────────────────────────────────────────────────────────
// Social login + registration helpers that are specific to the
// auth flow (Google OAuth redirect, reCAPTCHA registration).
//
// We keep these separate from services/authService.ts because
// they deal with browser redirects and captcha tokens — things
// that don't fit neatly into the standard CRUD pattern.
// ─────────────────────────────────────────────────────────────

export type SocialProvider = "google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ====== Google OAuth — redirect-based ======

export function startSocialLogin(provider: SocialProvider) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_provider", provider);
    sessionStorage.setItem("oauth_return_to", "/discover");
  }
  // Redirect the whole browser to the backend's Google OAuth URL
  window.location.href = `${API_BASE_URL}/auth/${provider}`;
}

// ====== Registration with reCAPTCHA ======

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  display_name: string;
  date_of_birth: string;          // "YYYY-MM-DD"
  gender: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY";
  captcha_token: string;
}

export async function registerWithCaptcha(payload: RegisterPayload) {
  // Uses the shared axios instance so cookies are handled automatically
  const response = await api.post("/auth/register", payload);
  useAuthStore.getState().setEmail(payload.email);
  return response.data;
}

// ====== Fetch logged-in user ======

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  const user = response.data;

  // Backend returns snake_case fields — map to camelCase for the store
  if (user) {
    useAuthStore.getState().setUser({
      id: user.id,
      email: user.email,
      displayName: user.display_name ?? "",
      handle: user.handle ?? "",
      avatarUrl: user.avatar_url ?? null,
      isVerified: user.is_verified ?? false,
    });
  }
  return user;
}