"use client";
import { useEffect } from "react";
import { getCurrentUser } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// useAuthInit
//
// Runs once when the app loads. Calls GET /auth/me to check if
// the user's cookies are still valid. If yes → store the user.
// If no → user stays logged out (nothing to clean up).
//
// Session revocation is handled automatically by the Axios
// interceptor in api.ts: when the access token expires and the
// refresh fails (because the session was revoked), it clears
// the auth store and redirects to the home page.
// ─────────────────────────────────────────────────────────────

export const useAuthInit = () => {
  useEffect(() => {
    getCurrentUser().catch(() => {
      // Not logged in — that's fine, do nothing
    });
  }, []);
};