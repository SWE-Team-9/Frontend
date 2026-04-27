"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useNotificationsSocket } from "@/src/hooks/useNotificationsSocket";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useNotificationsBoot() {
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);
  const handleSocketEvent = useNotificationStore((state) => state.handleSocketEvent);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchNotifications({ page: 1 });
    void refreshUnreadCount();
  }, [isAuthenticated, fetchNotifications, refreshUnreadCount]);

  useNotificationsSocket({
    enabled: isAuthenticated,
    onEvent: handleSocketEvent,
  });
}