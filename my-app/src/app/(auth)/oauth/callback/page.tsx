"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// OAuth Callback Page
//
// After Google OAuth finishes, the backend redirects the browser
// here. The backend already set httpOnly cookies, so we just
// call /auth/me to confirm the user is logged in, then redirect
// to /discover (or wherever they came from).
// ─────────────────────────────────────────────────────────────

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // getCurrentUser will set the user in the store automatically
        await getCurrentUser();

        // Redirect to wherever the user wanted to go (default: /discover)
        const returnTo = sessionStorage.getItem("oauth_return_to") || "/discover";
        router.replace(returnTo);
      } catch {
        setError("Login failed. Please try again.");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p>Signing you in...</p>
      )}
    </div>
  );
}