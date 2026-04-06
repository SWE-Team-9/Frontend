import axios from "axios";

// ─────────────────────────────────────────────────────────────
//   Our backend stores JWT tokens inside cookies that 
//   the browser sends automatically with every request. 
//   We do NOT store tokens in localStorage.
//   The `withCredentials: true` flag tells axios
//   to include those cookies on every call.
// ─────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ← cookies are sent automatically (httpOnly tokens)
});

// ─── Auto-refresh when access token expires ──────────────────
// If the server replies 401 (Unauthorized), we try ONE refresh
// request. If the refresh works the server sets new cookies and
// we retry the original request. If it fails, the user must log
// in again.
// ─────────────────────────────────────────────────────────────

let refreshPromise: Promise<void> | null = null; // prevents multiple refreshes at once

api.interceptors.response.use(
  (response) => response, // success → pass through
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If another request is already refreshing, wait for it
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")              // cookies sent automatically
            .then(() => {})                     // server sets new cookies
            .finally(() => { refreshPromise = null; });
        }

        await refreshPromise;

        // Retry the original request — the new cookie is now set
        return api(originalRequest);
      } catch {
        // Refresh failed — the session was revoked or the token expired.
        // Clear the user from the store and send them back to the home page.
        // We import useAuthStore lazily here to avoid circular-import issues
        // (api.ts is used inside authService.ts which is used by the store).
        try {
          const { useAuthStore } = await import("@/src/store/useAuthStore");
          const { useProfileStore } = await import("@/src/store/useProfileStore");
          useAuthStore.getState().logout();
          useProfileStore.getState().resetProfile();
        } catch {
          // If the store import fails for any reason, proceed to redirect anyway
        }
        if (typeof window !== "undefined") {
          window.location.replace("/");
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
