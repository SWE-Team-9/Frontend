import axios from "axios";

// ─────────────────────────────────────────────────────────────
// Axios instance that talks to our NestJS backend.
//
// KEY CONCEPT — "httpOnly cookies":
//   Our backend stores JWT tokens inside cookies that the browser
//   sends automatically with every request. We do NOT store tokens
//   in localStorage. The `withCredentials: true` flag tells axios
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there's no request config, just reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    // Endpoints that should NEVER trigger silent refresh
    const shouldSkipRefresh =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/resend-verification") ||
      requestUrl.includes("/auth/verify-email") ||
      requestUrl.includes("/auth/check-email") ||
      requestUrl.includes("/auth/refresh");

    // Only attempt refresh for 401s on requests that are NOT auth-entry flows
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")
            .then(() => {})
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return api(originalRequest);
      } catch {
        try {
          const { useAuthStore } = await import("@/src/store/useAuthStore");
          const { useProfileStore } = await import("@/src/store/useProfileStore");
          useAuthStore.getState().logout();
          useProfileStore.getState().resetProfile();
        } catch {
          // ignore store cleanup errors
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
