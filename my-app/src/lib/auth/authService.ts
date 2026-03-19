export type SocialProvider = "google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return API_URL;
}

export function startSocialLogin(provider: SocialProvider) {
  const apiUrl = ensureApiUrl();

  // Save where the user should come back after auth if needed
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_provider", provider);
    sessionStorage.setItem("oauth_return_to", "/");
  }

  window.location.href = `${apiUrl}/auth/${provider}`;
}

export interface CompleteOAuthPayload {
  code: string;
  state?: string;
  provider: SocialProvider;
}

export async function completeOAuthLogin(payload: CompleteOAuthPayload) {
  const apiUrl = ensureApiUrl();

  const res = await fetch(`${apiUrl}/auth/${payload.provider}/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("OAuth login failed.");
  }

  return res.json();
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
  const apiUrl = ensureApiUrl();

  const res = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Registration failed.");
  }

  return res.json();
}