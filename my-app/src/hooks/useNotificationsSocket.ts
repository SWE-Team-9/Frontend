"use client";

import { useEffect, useRef } from "react";
import { NotificationSocketEvent } from "@/src/types/notifications";
import { pushMockNotification } from "@/src/services/mocks/notificationsMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface UseNotificationsSocketOptions {
  enabled: boolean;
  onEvent: (event: NotificationSocketEvent) => void;
}

function getWebSocketUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (apiBaseUrl) {
    return apiBaseUrl.replace(/^http/, "ws") + "/api/v1/notifications";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/v1/notifications`;
}

export function useNotificationsSocket({
  enabled,
  onEvent,
}: UseNotificationsSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (USE_MOCK) {
      let mockUnreadCount = 3;

      mockTimerRef.current = setInterval(() => {
        const newNotification = pushMockNotification({
          type: "like",
          message: "New mock listener liked your track",
          actorId: "user_mock",
          actorDisplayName: "Mock Listener",
          actorHandle: "mock-listener",
          actorAvatarUrl:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
          entityType: "track",
          entityId: "trk_mock",
        });

        mockUnreadCount += 1;

        onEvent({
          type: "NEW_NOTIFICATION",
          message: newNotification.message,
          notification: newNotification,
          currentUnreadCount: mockUnreadCount,
        });
      }, 15000);

      return () => {
        if (mockTimerRef.current) clearInterval(mockTimerRef.current);
      };
    }

    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as NotificationSocketEvent;
          onEvent(event);
        } catch {
          return;
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [enabled, onEvent]);
}