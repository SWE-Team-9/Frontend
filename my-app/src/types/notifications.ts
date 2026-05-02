export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "repost"
  | "message"
  | "report_resolved"
  | "subscription"
  | "account_suspended"
  | "account_banned"
  | "account_restored";

export type NotificationEntityType =
  | "track"
  | "user"
  | "comment"
  | "playlist"
  | "message";

export type NotificationReadStatus = "all" | "read" | "unread";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  actorId: string;
  actorDisplayName?: string;
  actorHandle?: string;
  actorAvatarUrl?: string | null;
  entityType: NotificationEntityType;
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  page: number;
  limit: number;
  total: number;
  notifications: Notification[];
}

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  reposts: boolean;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationReadStatus;
}

export interface UnreadNotificationCountResponse {
  count: number;
}

export interface NotificationSocketEvent {
  type: "NEW_NOTIFICATION" | "NOTIFICATION_READ" | "ALL_NOTIFICATIONS_READ" | "NOTIFICATION_DELETED";
  message?: string;
  notification?: Notification;
  notificationId?: string;
  currentUnreadCount: number;
}