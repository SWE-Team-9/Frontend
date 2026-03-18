import api from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  dob: string;
  gender: string;
}

export const loginUser = async ({ email, password }: LoginData) => {
  const res = await api.post("/auth/login", { email, password });
  const { accessToken, refreshToken } = res.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken);
  useAuthStore.getState().setEmail(email);
  return res.data;
};

export const signupUser = async (data: SignupData) => {
  const res = await api.post("/auth/signup", data);
  const { accessToken, refreshToken } = res.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken);
  useAuthStore.getState().setEmail(data.email);
  return res.data;
};

export const logoutUser = async () => {
  useAuthStore.getState().clearTokens();
};