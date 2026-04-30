"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// OAuth Callback Page  —  /auth/callback
//
// After Google OAuth finishes, the backend redirects the browser
// to this page. The backend already set httpOnly cookies, so we
// just call /auth/me to confirm the user is logged in, then
// redirect to /discover (or wherever they came from).
//
// WHY THIS PATH?
//   The backend does: res.redirect(`${FRONTEND_URL}/auth/callback`)
//   So the frontend page MUST live at /auth/callback to match.
// ─────────────────────────────────────────────────────────────

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // getCurrentUser calls GET /auth/me — cookies are sent automatically.
        // It also updates the Zustand auth store with the user data.
        await getCurrentUser();

        // Redirect to wherever the user wanted to go (default: /discover)
        const returnTo = sessionStorage.getItem("oauth_return_to") || "/discover";
        sessionStorage.removeItem("oauth_return_to");
        sessionStorage.removeItem("oauth_provider");
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
        <div className="text-center space-y-4">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => router.replace("/")}
            className="text-white underline hover:text-gray-300"
          >
            Go back to home
          </button>
        </div>
      ) : (
        <p className="text-lg">Signing you in...</p>
      )}
    </div>
  );
}
