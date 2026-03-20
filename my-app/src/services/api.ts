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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ← this makes the browser send cookies automatically
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
        // Refresh failed → user must log in again
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
