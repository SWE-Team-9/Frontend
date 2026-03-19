export type SocialProvider = "google";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return API_BASE_URL;
}

export function startSocialLogin(provider: SocialProvider) {
  const apiBaseUrl = ensureApiBaseUrl();

  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_provider", provider);
    sessionStorage.setItem("oauth_return_to", "/discover");
  }

  window.location.href = `${apiBaseUrl}/auth/${provider}`;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  gender: string;
  captchaToken: string;
}

export async function registerWithCaptcha(payload: RegisterPayload) {
  const apiBaseUrl = ensureApiBaseUrl();

  const res = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Recaptcha-Token": payload.captchaToken,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Registration failed.");
  }

  return res.json();
}

export async function getCurrentUser() {
  const apiBaseUrl = ensureApiBaseUrl();

  const res = await fetch(`${apiBaseUrl}/auth/me`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user.");
  }

  return res.json();
}