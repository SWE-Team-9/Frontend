"use client";
import { useEffect } from "react";
import { getBootstrapData, BootstrapEntitlements } from "@/src/services/bffService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  normalizeBackendSubscription,
  SubscriptionDetails,
} from "@/src/services/subscriptionService";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─────────────────────────────────────────────────────────────
// useAuthInit
//
// Runs once when the app loads. Calls GET /app/bootstrap to
// restore session state and seed all shell stores in one request,
// replacing the previous pattern of calling /auth/me, then
// having downstream hooks call /notifications/unread-count,
// /notifications, /subscriptions/me, etc. separately.
//
// On 401 the bootstrap call is silently swallowed — the user
// is simply treated as a guest.
// ─────────────────────────────────────────────────────────────

/**
 * Builds a SubscriptionDetails from the entitlements block when the
 * full subscription object is absent from the bootstrap response.
 */
function entitlementsToSubDetails(e: BootstrapEntitlements): SubscriptionDetails {
  const planCode = e.planCode ?? "FREE";
  const subscriptionType: "FREE" | "PRO" | "GO+" =
    planCode === "GO_PLUS" ? "GO+" : planCode === "PRO" ? "PRO" : "FREE";
  const uploadLimit = e.uploadLimit < 0 ? Infinity : e.uploadLimit;
  return {
    userId: "",
    subscriptionType,
    planName: PLAN_CONFIG[subscriptionType]?.label ?? subscriptionType,
    isPremium: e.isPremium,
    subscriptionStatus: null,
    uploadLimit,
    uploadedTracks: e.uploadedCount ?? 0,
    remainingUploads: e.remainingUploads,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    renewalDate: null,
    expiresAt: null,
    trialStart: null,
    trialEnd: e.trialEnd ?? null,
    paymentMethodSummary: null,
    pendingDowngrade: null,
    perks: {
      adFree: !e.adsEnabled,
      offlineListening: e.canDownload,
    },
  };
}

export const useAuthInit = () => {
  useEffect(() => {
    // Skip on OAuth callback pages — they call bootstrap themselves and
    // set the auth store before redirecting. Running it again here would
    // make two identical network calls on every OAuth login.
    if (typeof window !== "undefined" && window.location.pathname.endsWith("/callback")) {
      return;
    }

    getBootstrapData()
      .then((data) => {
        // Seed profile store (minimal shell data; full profile loaded by profile page)
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
            isLoaded: false, // full profile still needs its own fetch for bio/links/genres
          });
        }

        // Seed notification store — skips the separate unread-count + list fetch
        useNotificationStore.getState().setFromBootstrap(
          data.notifications.unreadCount,
          data.notifications.latest,
        );

        // Seed subscription store.
        // The raw backend object must be normalized before storing so that
        // planCode "GO_PLUS" → subscriptionType "GO+", adsEnabled is inverted
        // to perks.adFree, etc.  Without this, premium checks fail everywhere.
        if (data.subscription) {
          const normalized = normalizeBackendSubscription(
            data.subscription as Record<string, unknown>,
          );
          useSubscriptionStore.getState().setSubDirectly(normalized);
        } else if (data.entitlements) {
          // Fallback: build a minimal SubscriptionDetails from the lighter
          // entitlements block when the full subscription object is absent.
          useSubscriptionStore
            .getState()
            .setSubDirectly(entitlementsToSubDetails(data.entitlements));
        }

        // Seed auth store last. This avoids a race where AuthProvider sees
        // user first and triggers fallback /subscriptions/me before bootstrap
        // has hydrated subscription from /app/bootstrap.
        const me = data.me;
        useAuthStore.getState().setUser({
          id: me.id,
          email: me.email,
          displayName: me.display_name ?? "",
          handle: me.handle ?? "",
          avatarUrl: me.avatar_url ?? null,
          isVerified: me.is_verified ?? false,
          systemRole: (me.system_role as "ADMIN" | "MODERATOR" | "USER") ?? "USER",
          account_status: me.account_status ?? "ACTIVE",
        });
      })
      .catch(() => {
        // 401 or network error — user is a guest, nothing to do
      });
  }, []);
};
