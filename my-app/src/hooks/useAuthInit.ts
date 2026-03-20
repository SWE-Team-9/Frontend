"use client";
import { useEffect } from "react";
import { getCurrentUser } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// useAuthInit
//
// Runs once when the app loads. Calls GET /auth/me to check if
// the user's cookies are still valid. If yes → store the user.
// If no → user stays logged out (nothing to clean up).
// ─────────────────────────────────────────────────────────────

export const useAuthInit = () => {
  useEffect(() => {
    // getCurrentUser already calls setUser inside the auth store
    getCurrentUser().catch(() => {
      // Not logged in — that's fine, do nothing
    });
  }, []);
};