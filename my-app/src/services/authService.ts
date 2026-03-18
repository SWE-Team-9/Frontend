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
  const RESPONSE = await api.post("/auth/login", { email, password }); // backend endpoint for login
  const { accessToken, refreshToken } = RESPONSE.data; // assuming the backend returns these tokens upon successful login
  useAuthStore.getState().setTokens(accessToken, refreshToken); // store the tokens in Zustand
  useAuthStore.getState().setEmail(email); 
  return RESPONSE.data; // return the response data for further use (AuthModal) can handle redirect, or display messages
};

export const signupUser = async (data: SignupData) => {
  const RESPONSE = await api.post("/auth/signup", data); // backend endpoint for signup
  const { accessToken, refreshToken } = RESPONSE.data; 
  useAuthStore.getState().setTokens(accessToken, refreshToken);
  useAuthStore.getState().setEmail(data.email);
  return RESPONSE.data;
};

export const logoutUser = async () => { // ((backend endpoint for logout)) clear tokens on frontend
  useAuthStore.getState().clearTokens();
};