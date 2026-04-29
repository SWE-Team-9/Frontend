"use client";
import { useEffect } from "react";
import { getBootstrapData } from "@/src/services/bffService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { SubscriptionDetails } from "@/src/services/subscriptionService";

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

export const useAuthInit = () => {
  useEffect(() => {
    getBootstrapData()
      .then((data) => {
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

        // Seed subscription store
        if (data.subscription) {
          useSubscriptionStore
            .getState()
            .setSubDirectly(data.subscription as unknown as SubscriptionDetails);
        }
      })
      .catch(() => {
        // 401 or network error — user is a guest, nothing to do
      });
  }, []);
};
