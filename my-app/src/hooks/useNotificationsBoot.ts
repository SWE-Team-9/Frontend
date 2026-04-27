"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useNotificationsSocket } from "@/src/hooks/useNotificationsSocket";

export function useNotificationsBoot() {
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);
  const handleSocketEvent = useNotificationStore((state) => state.handleSocketEvent);

  useEffect(() => {
    void fetchNotifications({ page: 1 });
    void refreshUnreadCount();
  }, [fetchNotifications, refreshUnreadCount]);

  useNotificationsSocket({
    enabled: true,
    onEvent: handleSocketEvent,
  });
}