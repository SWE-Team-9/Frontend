import axios from "axios";
import { useAuthStore } from "@/src/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; 

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor => attach access token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`; // Attach token to all requests 
    }
    return config;
  },
  (error) => Promise.reject(error) ////////////////////////////////// handle request errors 
);

// Response interceptor => auto-refresh JWT if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => { // Handle 401 errors by trying to refresh the token
    const originalRequest = error.config; // Save original request to retry after refreshing token

    if (error.response?.status === 401 && !originalRequest._retry) { // Check if error is due to unauthorized access (401) and we haven't already tried refreshing
      originalRequest._retry = true; // Mark request as retried to prevent infinite loops

      const { refreshToken, setTokens, clearTokens } = useAuthStore.getState();
      if (!refreshToken) { // No refresh token available, force logout
        clearTokens();
        return Promise.reject(error);
      }

      try {
        const RESPONSE = await axios.post(`${API_URL}/auth/refresh-token`, { // Call refresh endpoint with the current refresh token
          refreshToken,
        });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = RESPONSE.data; // Extract new tokens from backend response
        setTokens(newAccessToken, newRefreshToken); // Update tokens in Zustand store
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`; // Update original request with new access token
        return axios(originalRequest); // Retry original request with new token
      } catch (err) { // Refresh token failed
        clearTokens(); // Clear tokens from store to log out user
        return Promise.reject(err); 
      }
    }

    return Promise.reject(error);
  }
);

export default api;