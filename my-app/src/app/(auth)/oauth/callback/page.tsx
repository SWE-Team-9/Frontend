"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBootstrapData } from "@/src/services/bffService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  normalizeBackendSubscription,
  SubscriptionDetails,
} from "@/src/services/subscriptionService";
import { PLAN_CONFIG } from "@/src/config/plans";

function entitlementsToSubDetails(e: {
  planCode?: string;
  isPremium?: boolean;
  uploadLimit?: number;
  uploadedCount?: number;
  remainingUploads?: number | null;
  adsEnabled?: boolean;
  canDownload?: boolean;
  trialEnd?: string | null;
}): SubscriptionDetails {
  const planCode = e.planCode ?? "FREE";
  const subscriptionType: "FREE" | "PRO" | "GO+" =
    planCode === "GO_PLUS" ? "GO+" : planCode === "PRO" ? "PRO" : "FREE";
  const uploadLimit = (e.uploadLimit ?? PLAN_CONFIG.FREE.uploadLimit) < 0
    ? Infinity
    : (e.uploadLimit ?? PLAN_CONFIG.FREE.uploadLimit);

  return {
    userId: "",
    subscriptionType,
    planName: PLAN_CONFIG[subscriptionType]?.label ?? subscriptionType,
    isPremium: !!e.isPremium,
    subscriptionStatus: null,
    uploadLimit,
    uploadedTracks: e.uploadedCount ?? 0,
    remainingUploads: e.remainingUploads ?? uploadLimit,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    renewalDate: null,
    expiresAt: null,
    trialStart: null,
    trialEnd: e.trialEnd ?? null,
    paymentMethodSummary: null,
    pendingDowngrade: null,
    perks: {
      adFree: !(e.adsEnabled ?? true),
      offlineListening: !!e.canDownload,
    },
  };
}

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
            .setSubDirectly(
              normalizeBackendSubscription(data.subscription as Record<string, unknown>),
            );
        } else if (data.entitlements) {
          useSubscriptionStore
            .getState()
            .setSubDirectly(entitlementsToSubDetails(data.entitlements));
        }

        const me = data.me;
        useAuthStore.getState().setUser({
          id: me.id,
          email: me.email,
          displayName: me.display_name ?? "",
          handle: me.handle ?? "",
          avatarUrl: me.avatar_url ?? null,
          isVerified: me.is_verified ?? false,
        });

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
