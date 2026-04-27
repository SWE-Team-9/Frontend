import api from "@/src/services/api";
import {
  GetNotificationsParams,
  Notification,
  NotificationEntityType,
  NotificationPreferences,
  NotificationsResponse,
  NotificationType,
  UnreadNotificationCountResponse,
} from "@/src/types/notifications";
import {
  mockDeleteNotification,
  mockGetNotifications,
  mockGetPreferences,
  mockGetUnreadCount,
  mockMarkAllAsRead,
  mockMarkAsRead,
  mockRegisterPushDevice,
  mockRemovePushDevice,
  mockUpdatePreferences,
} from "@/src/services/mocks/notificationsMocks";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface RawNotificationActor {
  id?: string;
  user_id?: string;
  userId?: string;
  actor_id?: string;
  actorId?: string;
  handle?: string;
  username?: string;
  display_name?: string;
  displayName?: string;
  name?: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  profile_image_url?: string | null;
  profileImageUrl?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
}

interface RawNotification {
  id?: string;
  _id?: string;
  type?: string;
  message?: string;
  text?: string;
  actorId?: string;
  actor_id?: string;
  actorDisplayName?: string;
  actor_display_name?: string;
  actorHandle?: string;
  actor_handle?: string;
  actorAvatarUrl?: string | null;
  actor_avatar_url?: string | null;
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  targetId?: string;
  target_id?: string;
  isRead?: boolean;
  is_read?: boolean;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  time?: string;
  actor?: RawNotificationActor;
  user?: RawNotificationActor;
  sender?: RawNotificationActor;
}

interface RawNotificationsResponse {
  page?: number;
  limit?: number;
  total?: number;
  notifications?: RawNotification[];
}

const NOTIFICATION_TYPES: NotificationType[] = ["like", "comment", "follow", "repost"];
const NOTIFICATION_ENTITY_TYPES: NotificationEntityType[] = [
  "track",
  "user",
  "comment",
  "playlist",
];

function mapNotificationTypeToBackend(
  type?: NotificationType,
): Uppercase<NotificationType> | undefined {
  if (!type) return undefined;
  return type.toUpperCase() as Uppercase<NotificationType>;
}

function mapNotificationStatusToBackendIsRead(
  status?: GetNotificationsParams["status"],
): boolean | undefined {
  if (status === "read") return true;
  if (status === "unread") return false;
  return undefined;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return undefined;
}

function pickNullableString(...values: unknown[]): string | null | undefined {
  for (const value of values) {
    if (value === null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return undefined;
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function normalizeType(value: unknown): NotificationType {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (NOTIFICATION_TYPES.includes(normalized as NotificationType)) {
    return normalized as NotificationType;
  }

  return "like";
}

function normalizeEntityType(value: unknown, fallbackType: NotificationType): NotificationEntityType {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (NOTIFICATION_ENTITY_TYPES.includes(normalized as NotificationEntityType)) {
    return normalized as NotificationEntityType;
  }

  return fallbackType === "follow" ? "user" : "track";
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.floor(numeric);
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return Math.floor(numeric);
}

export function normalizeNotification(payload: unknown): Notification {
  const raw = (payload || {}) as RawNotification;
  const actor = raw.actor || raw.user || raw.sender;

  const type = normalizeType(raw.type);
  const actorId =
    pickString(
      raw.actorId,
      raw.actor_id,
      actor?.id,
      actor?.userId,
      actor?.user_id,
      actor?.actorId,
      actor?.actor_id,
      raw.entityId,
      raw.entity_id
    ) ?? "";

  const actorDisplayName = pickString(
    raw.actorDisplayName,
    raw.actor_display_name,
    actor?.displayName,
    actor?.display_name,
    actor?.name
  );

  const actorHandle = pickString(
    raw.actorHandle,
    raw.actor_handle,
    actor?.handle,
    actor?.username
  );

  const actorAvatarUrl = pickNullableString(
    raw.actorAvatarUrl,
    raw.actor_avatar_url,
    actor?.avatarUrl,
    actor?.avatar_url,
    actor?.profileImageUrl,
    actor?.profile_image_url,
    actor?.imageUrl,
    actor?.image_url
  );

  const entityId =
    pickString(raw.entityId, raw.entity_id, raw.targetId, raw.target_id, actorId) ?? actorId;

  const createdAt =
    pickString(raw.createdAt, raw.created_at, raw.timestamp, raw.time) ??
    new Date().toISOString();

  return {
    id: pickString(raw.id, raw._id) ?? `${type}-${entityId}-${createdAt}`,
    type,
    message: pickString(raw.message, raw.text) ?? "",
    actorId,
    actorDisplayName,
    actorHandle,
    actorAvatarUrl: actorAvatarUrl ?? null,
    entityType: normalizeEntityType(raw.entityType ?? raw.entity_type, type),
    entityId,
    isRead: pickBoolean(raw.isRead, raw.is_read) ?? false,
    createdAt,
  };
}

function normalizeNotificationsResponse(payload: unknown): NotificationsResponse {
  const raw = (payload || {}) as RawNotificationsResponse;
  const notifications = Array.isArray(raw.notifications)
    ? raw.notifications.map((notification) => normalizeNotification(notification))
    : [];

  return {
    page: normalizePositiveInteger(raw.page, 1),
    limit: normalizePositiveInteger(raw.limit, notifications.length || 20),
    total: normalizeNonNegativeInteger(raw.total, notifications.length),
    notifications,
  };
}

// ===============================
//  GET NOTIFICATIONS
// ===============================
export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<NotificationsResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return normalizeNotificationsResponse(mockGetNotifications(params));
  }

  const { data } = await api.get<NotificationsResponse>("/notifications", {
    params: {
      page: params.page,
      limit: params.limit,
      type: mapNotificationTypeToBackend(params.type),
      isRead: mapNotificationStatusToBackendIsRead(params.status),
    },
  });

  return normalizeNotificationsResponse(data);
}

// =================================
//  GET UNREAD NOTIFICATIONS COUNT
// =================================
export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockGetUnreadCount();
  }

  const { data } = await api.get<UnreadNotificationCountResponse>("/notifications/unread-count");
  return data;
}

// ===============================
//  MARK NOTIFICATION AS READ
// ===============================
export async function markNotificationAsRead(notificationId: string): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMarkAsRead(notificationId);
  }

  const { data } = await api.patch<{ message: string }>(`/notifications/${notificationId}/read`);
  return data;
}

// ===============================
//  MARK ALL NOTIFICATIONS AS READ
// ===============================
export async function markAllNotificationsAsRead(): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMarkAllAsRead();
  }

  const { data } = await api.patch<{ message: string }>("/notifications/read-all");
  return data;
}

// ===============================
//  DELETE NOTIFICATION
// ===============================
export async function deleteNotification(notificationId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    mockDeleteNotification(notificationId);
    return;
  }

  await api.delete(`/notifications/${notificationId}`);
}

// ===============================
//  GET NOTOFICATION PREFERENCES
// ===============================
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockGetPreferences();
  }

  const { data } = await api.get<NotificationPreferences>("/notifications/preferences");
  return data;
}

// ===============================
//  UPDATE NOTIFICATION PREFERENCES
// ===============================
export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockUpdatePreferences(preferences);
  }

  const { data } = await api.put<{ message: string }>("/notifications/preferences", preferences);
  return data;
}

// ===================================
//  REGISTER PUSH NOTIFICATION DEVICE
// ===================================
export async function registerPushNotificationDevice(payload: {
  deviceToken: string;
  platform: "ios" | "android" | "web";
}): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockRegisterPushDevice(payload);
  }

  const { data } = await api.post<{ message: string }>("/notifications/push/register", payload);
  return data;
}

// =================================
//  REMOVE PUSH NOTIFICATION DEVICE
// =================================
export async function removePushNotificationDevice(deviceId: string): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockRemovePushDevice(deviceId);
  }

  const { data } = await api.delete<{ message: string }>(`/notifications/push/${deviceId}`);
  return data;
}