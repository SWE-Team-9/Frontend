"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationSocketEvent } from "@/src/types/notifications";
import { pushMockNotification } from "@/src/services/mocks/notificationsMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

interface UseNotificationsSocketOptions {
  enabled: boolean;
  onEvent: (event: NotificationSocketEvent) => void;
}

export function useNotificationsSocket({
  enabled,
  onEvent,
}: UseNotificationsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
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

    const socket = io(`${SOCKET_URL}/notifications`, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = socket;

    socket.on("new_notification", (payload: unknown) => {
      onEvent(payload as NotificationSocketEvent);
    });

    socket.on("unread_count_updated", (payload: unknown) => {
      onEvent(payload as NotificationSocketEvent);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, onEvent]);
}