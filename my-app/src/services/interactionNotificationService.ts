import { pushMockNotification } from "@/src/services/mocks/notificationsMocks";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { NotificationType } from "@/src/types/notifications";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface TrackInteractionNotificationMeta {
  trackTitle?: string;
  targetUserId?: string;
}

interface ActorIdentity {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
}

function syncNotificationsAfterInteraction(): void {
  if (typeof window === "undefined") return;

  void import("@/src/store/notificationsStore")
    .then(({ useNotificationStore }) => {
      const state = useNotificationStore.getState();
      void state.refreshUnreadCount();
      void state.fetchNotifications({ page: 1 });
    })
    .catch(() => {
      return;
    });
}

function toHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function getActorIdentity(): ActorIdentity {
  const user = useAuthStore.getState().user;
  const displayName = user?.displayName?.trim() || user?.handle?.trim() || "Someone";
  const handle = user?.handle?.trim() || toHandle(displayName) || "someone";

  return {
    id: user?.id || "user_mock_actor",
    displayName,
    handle,
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function shouldSkipSelfNotification(actorId: string, targetUserId?: string): boolean {
  if (!targetUserId) return false;
  return actorId === targetUserId;
}

function buildTrackMessage(type: Exclude<NotificationType, "follow">, actorName: string, trackTitle?: string): string {
  const normalizedTitle = trackTitle?.trim();

  if (type === "like") {
    return normalizedTitle
      ? `${actorName} liked your track ${normalizedTitle}`
      : `${actorName} liked your track`;
  }

  if (type === "comment") {
    return normalizedTitle
      ? `${actorName} commented on your track ${normalizedTitle}`
      : `${actorName} commented on your track`;
  }

  return normalizedTitle
    ? `${actorName} reposted your track ${normalizedTitle}`
    : `${actorName} reposted your track`;
}

export function triggerTrackInteractionNotification(
  type: "like" | "comment" | "repost",
  trackId: string,
  meta?: TrackInteractionNotificationMeta,
): void {
  if (!USE_MOCK) {
    syncNotificationsAfterInteraction();
    return;
  }

  const actor = getActorIdentity();
  if (shouldSkipSelfNotification(actor.id, meta?.targetUserId)) return;

  pushMockNotification({
    type,
    message: buildTrackMessage(type, actor.displayName, meta?.trackTitle),
    actorId: actor.id,
    actorDisplayName: actor.displayName,
    actorHandle: actor.handle,
    actorAvatarUrl: actor.avatarUrl,
    entityType: "track",
    entityId: trackId,
  });
}

export function triggerFollowNotification(targetUserId: string): void {
  if (!USE_MOCK) {
    syncNotificationsAfterInteraction();
    return;
  }

  const actor = getActorIdentity();
  if (shouldSkipSelfNotification(actor.id, targetUserId)) return;

  pushMockNotification({
    type: "follow",
    message: `${actor.displayName} started following you`,
    actorId: actor.id,
    actorDisplayName: actor.displayName,
    actorHandle: actor.handle,
    actorAvatarUrl: actor.avatarUrl,
    entityType: "user",
    entityId: targetUserId,
  });
}
