"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBootstrapData } from "@/src/services/bffService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { SubscriptionDetails } from "@/src/services/subscriptionService";

// ─────────────────────────────────────────────────────────────
// OAuth Callback Page  —  /auth/callback
//
// After Google OAuth finishes, the backend redirects the browser
// to this page. The backend already set httpOnly cookies, so we
// call /app/bootstrap once to confirm the session and seed all
// shell stores in a single round-trip, then redirect.
//
// WHY THIS PATH?
//   The backend does: res.redirect(`${FRONTEND_URL}/auth/callback`)
//   So the frontend page MUST live at /auth/callback to match.
// ─────────────────────────────────────────────────────────────

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const data = await getBootstrapData();

        // Seed auth store
        const me = data.me;
        useAuthStore.getState().setUser({
          id: me.id,
          email: me.email,
          displayName: me.display_name ?? "",
          handle: me.handle ?? "",
          avatarUrl: me.avatar_url ?? null,
          isVerified: me.is_verified ?? false,
        });

        // Seed profile store
        if (data.profile) {
          const p = data.profile;
          useProfileStore.getState().setProfileData({
            userId: p.id,
            displayName: p.displayName ?? "",
            handle: p.handle ?? "",
            avatarUrl: p.avatarUrl ?? null,
            coverUrl: p.coverUrl ?? null,
            accountType: (p.accountType as "ARTIST" | "LISTENER") ?? "LISTENER",
            followersCount: p.followersCount ?? 0,
            followingCount: p.followingCount ?? 0,
            tracksCount: p.tracksCount ?? 0,
            isLoaded: false,
          });
        }

        // Seed notification store
        useNotificationStore.getState().setFromBootstrap(
          data.notifications.unreadCount,
          data.notifications.latest,
        );

        // Seed subscription store
        if (data.subscription) {
          useSubscriptionStore
            .getState()
            .setSubDirectly(data.subscription as unknown as SubscriptionDetails);
        }

        // Redirect to wherever the user wanted to go (default: /discover)
        const returnTo = sessionStorage.getItem("oauth_return_to") || "/discover";
        sessionStorage.removeItem("oauth_return_to");
        sessionStorage.removeItem("oauth_provider");
        router.replace(returnTo);
      } catch {
        setError("Login failed. Please try again.");
      }
    };

    handleCallback();
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
