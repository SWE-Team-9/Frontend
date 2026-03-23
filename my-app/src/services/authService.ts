import api from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";

// ─────────────────────────────────────────────────────────────
// Auth Service
//
// Every function here calls our NestJS backend at /api/v1/auth/*.
// The base URL already includes /api/v1 (set in api.ts), so we
// only write the path starting from /auth/...
//
// COOKIES: The backend sets httpOnly cookies on login/register.
//          We never touch tokens directly — they travel in cookies
//          automatically.
// ─────────────────────────────────────────────────────────────

// ====== Types that match the backend DTOs ======

interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
  captcha_token?: string;  
}

interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  display_name: string;
  date_of_birth: string;       // "YYYY-MM-DD"
  gender: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY";
  captcha_token?: string;
}

// ================= LOGIN =================
export const loginUser = async ({
  email,
  password,
  remember_me,
  captcha_token,
}: LoginData) => {
  // POST /auth/login  →  sets httpOnly cookies + returns { message, user }
  const response = await api.post("/auth/login", {
    email,
    password,
    remember_me,
    //captcha_token,
  });
  const { user } = response.data;
  
  // Backend returns snake_case fields — we map them to camelCase for the store
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
  return response.data;
};

// ================= REGISTER =================
export const registerUser = async (data: RegisterData) => {
  // POST /auth/register  →  returns { message }
  const response = await api.post("/auth/register", data);
  // After registration the user must verify their email before they can log in
  useAuthStore.getState().setEmail(data.email);
  return response.data;
};

// ================= LOGOUT =================
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout"); // clears httpOnly cookies on the backend
  } finally {
    useAuthStore.getState().logout();
    useProfileStore.getState().resetProfile();
  }
};

// ================= LOGOUT ALL SESSIONS =================
export const logoutAllSessions = async () => {
  try {
    await api.post("/auth/logout-all");
  } finally {
    useAuthStore.getState().logout();
    useProfileStore.getState().resetProfile();
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// ================= RESET PASSWORD =================
export const resetPassword = async (
  token: string,
  newPassword: string,
  newPasswordConfirm: string,
) => {
  const response = await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  });
  return response.data;
};

// ================= CHANGE PASSWORD (logged in) =================
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
) => {
  const response = await api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  });
  return response.data;
};

// ================= EMAIL VERIFICATION =================
export const verifyEmail = async (token: string) => {
  // POST /auth/verify-email  with { token }
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
};

// ================= RESEND VERIFICATION EMAIL =================
export const resendVerification = async (email: string) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

// ================= EMAIL CHANGE =================
export const requestEmailChange = async (newEmail: string, currentPassword: string) => {
  const response = await api.post("/auth/email/change", { new_email: newEmail, current_password: currentPassword });
  return response.data;
};

export const confirmEmailChange = async (token: string) => {
  const response = await api.post("/auth/email/confirm-change", { token });
  return response.data;
};

// ================= GET CURRENT USER =================
export const getCurrentUser = async () => {
  // GET /auth/me  →  returns user object
  const response = await api.get("/auth/me");
  const user = response.data;

  // Backend returns snake_case fields — we map them to camelCase for the store
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
};

// ================= SESSIONS =================
export const getSessions = async () => {
  const response = await api.get("/auth/sessions");
  return response.data;
};

export const revokeSession = async (sessionId: string) => {
  const response = await api.delete(`/auth/sessions/${sessionId}`);
  return response.data;
};

