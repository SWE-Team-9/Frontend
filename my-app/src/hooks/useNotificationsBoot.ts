"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useNotificationsSocket } from "@/src/hooks/useNotificationsSocket";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useNotificationsBoot() {
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);
  const seededFromBootstrap = useNotificationStore((state) => state.seededFromBootstrap);
  const handleSocketEvent = useNotificationStore((state) => state.handleSocketEvent);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Skip the initial fetch when bootstrap already populated the store.
    // The WebSocket will push any new notifications that arrive after boot.
    if (seededFromBootstrap) return;
    void fetchNotifications({ page: 1 });
    void refreshUnreadCount();
  }, [isAuthenticated, seededFromBootstrap, fetchNotifications, refreshUnreadCount]);

  useNotificationsSocket({
    enabled: isAuthenticated,
    onEvent: handleSocketEvent,
  });
}
