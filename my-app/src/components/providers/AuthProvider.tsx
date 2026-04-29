"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useAuthInit } from "@/src/hooks/useAuthInit";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessageStore } from "@/src/store/messageStore";
import { useLikeStore } from "@/src/store/likeStore";
import { useRepostStore } from "@/src/store/repostStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

// ─────────────────────────────────────────────────────────────
// AuthProvider
//
// Lives in the root layout — mounts ONCE per browser session.
//
// Responsibilities:
//   1. Run useAuthInit (bootstrap call → seeds auth + profile +
//      notifications + subscription stores in one request).
//   2. Connect / disconnect the message WebSocket on auth change.
//   3. Sync likes, reposts, subscription, and message unread
//      count ONCE when the user first authenticates, then never
//      again until logout + re-login.
//
//      These were previously called from NavBar useEffects,
//      which meant they fired on every page that includes a
//      NavBar (every navigation). Moving them here means they
//      fire exactly once per auth session.
// ─────────────────────────────────────────────────────────────

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectSocket = useMessageStore((state) => state.connectSocket);
  const disconnectSocket = useMessageStore((state) => state.disconnectSocket);
  const loadUnreadCount = useMessageStore((state) => state.loadUnreadCount);
  const syncLikes = useLikeStore((state) => state.syncWithServer);
  const syncReposts = useRepostStore((state) => state.syncWithServer);
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);
  const sub = useSubscriptionStore((state) => state.sub);

  // Track whether we have already synced for this auth session so we don't
  // re-fire if components re-render while user object is stable.
  const syncedUserIdRef = useRef<string | null>(null);

  // Message socket — connect / disconnect on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, connectSocket, disconnectSocket]);

  // Global per-session data sync — runs once when the user id is first set,
  // skips if bootstrap already seeded the subscription (sub !== null).
  useEffect(() => {
    if (!user?.id) return;
    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;

    void loadUnreadCount();
    void syncLikes(user.id);
    void syncReposts(user.id);
    // Only fetch subscription if bootstrap did not already seed it
    if (!sub) {
      void fetchSubscription();
    }
  }, [user?.id, loadUnreadCount, syncLikes, syncReposts, fetchSubscription, sub]);

  // Clear sync guard on logout
  useEffect(() => {
    if (!isAuthenticated) {
      syncedUserIdRef.current = null;
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
