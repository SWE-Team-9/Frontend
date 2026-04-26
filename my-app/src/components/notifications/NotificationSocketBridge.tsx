"use client";

import { useNotificationsBoot } from "@/src/hooks/useNotificationsBoot";

export function NotificationSocketBridge() {
  useNotificationsBoot();
  return null;
}