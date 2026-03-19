import api from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  dob: string;
  gender: string;
}

// ================= LOGIN =================
export const loginUser = async ({ email, password }: LoginData) => {
  const RESPONSE = await api.post("/auth/login", { email, password }); // backend endpoint for login
  const { accessToken, refreshToken } = RESPONSE.data ?? {}; // Extract tokens from response (if any)

  if (accessToken) { // if received an access token, store it in the auth store (Zustand) for use in authenticated requests
    useAuthStore.getState().setTokens(accessToken, refreshToken ?? null);
  }
  useAuthStore.getState().setEmail(email);
  return RESPONSE.data; // return the response data for further use (AuthModal) can handle redirect, or display messages
};

// ================= REGISTER =================
export const registerUser = async (data: RegisterData) => {
  const RESPONSE = await api.post("/auth/register", data); // backend endpoint for registration
  const { accessToken, refreshToken } = RESPONSE.data ?? {};
  
  if (accessToken) {
    useAuthStore.getState().setTokens(accessToken, refreshToken ?? null);
  }

  useAuthStore.getState().setEmail(data.email);
  return RESPONSE.data;
};

// ================= LOGOUT =================
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    useAuthStore.getState().clearTokens();
  }
};

// ================= REFRESH TOKEN =================
export const refreshToken = async () => {
  const RESPONSE = await api.post("/auth/refresh");
  return RESPONSE.data;
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (email: string) => {
  return await api.post("/auth/forgot-password", { email });
};

// ================= RESET PASSWORD =================
export const resetPassword = async (token: string, newPassword: string) => {
  return await api.post("/auth/reset-password", {
    token,
    password: newPassword,  // what the backend expects
    newPassword,
  });
};

// ================= EMAIL VERIFICATION =================
export const verifyEmail = async (token: string) => {
  return api.get("/auth/verify-email", { params: { token } });
};

// ================= RESEND VERIFICATION EMAIL =================
export const resendVerification = async (email: string) => {
  return await api.post("/auth/resend-verification", { email });
};

// ================= GET CURRENT USER =================
export const getCurrentUser = async () => {
  return await api.get("/auth/me");
};

// ================= SESSIONS =================
export const getSessions = async () => {
  return api.get("/auth/sessions");
};

export const revokeSession = async (sessionId: string) => {
  return api.delete(`/auth/sessions/${sessionId}`);
};

export const revokeAllSessions = async () => {
  return api.post("/auth/sessions/revoke-all");
};

// ================= ACCOUNT SECURITY =================
export const changePassword = async (currentPassword: string, newPassword: string) => {
  return api.patch("/auth/change-password", { currentPassword, newPassword });
};

export const requestEmailChange = async (newEmail: string, password: string) => {
  return api.post("/auth/request-email-change", { newEmail, password });
};

export const confirmEmailChange = async (token: string) => {
  return api.post("/auth/confirm-email-change", { token });
};

