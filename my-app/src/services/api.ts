import axios from "axios";
import { useAuthStore } from "@/src/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests for authentication
});

let refreshPromise: Promise<string | null> | null = null; // To track ongoing refresh token request and prevent multiple simultaneous refreshes

// Request interceptor => attach access token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`; // Attach token to all requests
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor => auto-refresh JWT if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors by trying to refresh the token
    const originalRequest = error.config; // Save original request to retry after refreshing token

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if error is due to unauthorized access (401) and we haven't already tried refreshing
      originalRequest._retry = true; // Mark request as retried to prevent infinite loops

      const { refreshToken, setTokens, clearTokens } = useAuthStore.getState();

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const RESPONSE = await axios.post(
              `${API_URL}/auth/refresh`,
              refreshToken ? { refreshToken } : {},
              { withCredentials: true },
            );

            const newAccessToken = RESPONSE.data?.accessToken ?? null;
            const newRefreshToken =
              RESPONSE.data?.refreshToken ?? refreshToken ?? null;

            if (!newAccessToken) return null;
            setTokens(newAccessToken, newRefreshToken);
            return newAccessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        if (!newAccessToken) {
          clearTokens();
          return Promise.reject(error);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        clearTokens();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
