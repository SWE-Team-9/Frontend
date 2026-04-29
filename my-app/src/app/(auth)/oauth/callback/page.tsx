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
// OAuth Callback Page
//
// After Google OAuth finishes, the backend redirects the browser
// here. The backend already set httpOnly cookies, so we call
// /app/bootstrap once to seed all shell stores and redirect.
// ─────────────────────────────────────────────────────────────

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const data = await getBootstrapData();

        const me = data.me;
        useAuthStore.getState().setUser({
          id: me.id,
          email: me.email,
          displayName: me.display_name ?? "",
          handle: me.handle ?? "",
          avatarUrl: me.avatar_url ?? null,
          isVerified: me.is_verified ?? false,
        });

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

        useNotificationStore.getState().setFromBootstrap(
          data.notifications.unreadCount,
          data.notifications.latest,
        );

        if (data.subscription) {
          useSubscriptionStore
            .getState()
            .setSubDirectly(data.subscription as unknown as SubscriptionDetails);
        }

        const returnTo = sessionStorage.getItem("oauth_return_to") || "/discover";
        sessionStorage.removeItem("oauth_return_to");
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
        <p className="text-red-500">{error}</p>
      ) : (
        <p>Signing you in...</p>
      )}
    </div>
  );
}
