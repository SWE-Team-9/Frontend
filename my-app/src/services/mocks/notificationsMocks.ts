import {
  GetNotificationsParams,
  Notification,
  NotificationPreferences,
  NotificationsResponse,
  UnreadNotificationCountResponse,
} from "@/src/types/notifications";

let mockNotifications: Notification[] = [
  {
    id: "not_001",
    type: "follow",
    message: "Menna Hesham started following you",
    actorId: "user_22",
    actorDisplayName: "Menna Hesham",
    actorHandle: "menna-hesham",
    actorAvatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    entityType: "user",
    entityId: "user_22",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
  },
  {
    id: "not_002",
    type: "like",
    message: "Ahmed Tarek liked your track Midnight Drive",
    actorId: "user_31",
    entityType: "track",
    entityId: "trk_91",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "not_003",
    type: "comment",
    message: "Sara Adel commented on your track Sunset Loop",
    actorId: "user_44",
    entityType: "track",
    entityId: "trk_77",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "not_004",
    type: "repost",
    message: "Omar Khaled reposted your track City Lights",
    actorId: "user_15",
    entityType: "track",
    entityId: "trk_45",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "not_005",
    type: "like",
    message: "Layla Hassan liked your track Ocean Breeze",
    actorId: "user_57",
    entityType: "track",
    entityId: "trk_22",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "not_006",
    type: "follow",
    message: "Youssef Nabil started following you",
    actorId: "user_88",
    actorDisplayName: "Youssef Nabil",
    actorHandle: "youssef-nabil",
    actorAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    entityType: "user",
    entityId: "user_88",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: "not_007",
    type: "comment",
    message: "Nour Salah commented on your track Late Night",
    actorId: "user_91",
    entityType: "track",
    entityId: "trk_18",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
  {
    id: "not_008",
    type: "repost",
    message: "Mariam Fouad reposted your track Lost Signal",
    actorId: "user_63",
    entityType: "track",
    entityId: "trk_12",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
  },
];

let mockPreferences: NotificationPreferences = {
  likes: true,
  comments: true,
  follows: true,
  reposts: true,
};

const mockDevices = new Map<string, { deviceToken: string; platform: string }>();

export function mockGetNotifications(
  params: GetNotificationsParams = {}
): NotificationsResponse {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  let filtered = [...mockNotifications];

  if (params.type) {
    filtered = filtered.filter((notification) => notification.type === params.type);
  }

  if (params.status === "unread") {
    filtered = filtered.filter((notification) => !notification.isRead);
  } else if (params.status === "read") {
    filtered = filtered.filter((notification) => notification.isRead);
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    page,
    limit,
    total: filtered.length,
    notifications: filtered.slice(start, end),
  };
}

export function mockGetUnreadCount(): UnreadNotificationCountResponse {
  const count = mockNotifications.filter((notification) => !notification.isRead).length;
  return { count };
}

export function mockMarkAsRead(notificationId: string): { message: string } {
  mockNotifications = mockNotifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification
  );

  return { message: "Notification marked as read" };
}

export function mockMarkAllAsRead(): { message: string } {
  mockNotifications = mockNotifications.map((notification) => ({
    ...notification,
    isRead: true,
  }));

  return { message: "All notifications marked as read" };
}

export function mockDeleteNotification(notificationId: string): void {
  mockNotifications = mockNotifications.filter(
    (notification) => notification.id !== notificationId
  );
}

export function mockGetPreferences(): NotificationPreferences {
  return { ...mockPreferences };
}

export function mockUpdatePreferences(
  preferences: NotificationPreferences
): { message: string } {
  mockPreferences = { ...preferences };
  return { message: "Notification preferences updated" };
}

export function mockRegisterPushDevice(payload: {
  deviceToken: string;
  platform: string;
}): { message: string } {
  const deviceId = `dev_${Math.random().toString(36).slice(2, 10)}`;
  mockDevices.set(deviceId, payload);
  return { message: "Device registered for push notifications" };
}

export function mockRemovePushDevice(deviceId: string): { message: string } {
  mockDevices.delete(deviceId);
  return { message: "Device removed successfully" };
}

export function pushMockNotification(notification: Omit<Notification, "id" | "createdAt" | "isRead">) {
  const newNotification: Notification = {
    ...notification,
    id: `not_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  mockNotifications = [newNotification, ...mockNotifications];
  return newNotification;
}