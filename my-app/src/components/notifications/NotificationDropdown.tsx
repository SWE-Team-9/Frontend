"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdPersonOutline } from "react-icons/md";
import { UserCard, UserCardUser } from "@/src/components/user/UserCard";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { Notification } from "@/src/types/notifications";

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

function getActionText(notification: Notification) {
  switch (notification.type) {
    case "follow":
      return "started following you";
    case "like":
      return "liked your track";
    case "comment":
      return "commented on your track";
    case "repost":
      return "reposted your track";
    default:
      return "";
  }
}

function getActorNameFromNotification(notification: Notification) {
  if (notification.actorDisplayName?.trim()) {
    return notification.actorDisplayName.trim();
  }

  const message = notification.message?.trim();
  if (!message) return "Someone";

  const match = message.match(
    /^(.*?)\s(?:started following you|liked your track|commented on your track|reposted your track)\b/i,
  );

  if (match?.[1]) {
    return match[1].trim() || "Someone";
  }

  return message.split(" ")[0] ?? "Someone";
}

function mapFollowNotificationToUserCard(
  notification: Notification,
): UserCardUser {
  return {
    userId: notification.actorId,
    displayName: getActorNameFromNotification(notification),
    handle: notification.actorHandle || notification.actorId,
    avatarUrl: notification.actorAvatarUrl ?? null,
  };
}

function getNotificationTarget(notification: Notification) {
  if (notification.entityType === "track") {
    return `/tracks/${notification.entityId}`;
  }
  if (notification.entityType === "user") {
    const profileSlug = notification.actorHandle || notification.actorId;
    return `/profiles/${profileSlug}`;
  }
  return "/notifications";
}

export function NotificationDropdown() {
  const router = useRouter();
  const notifications = useNotificationStore(
    (state) => state.dropdownNotifications,
  );
  const isLoading = useNotificationStore((state) => state.isLoading);
  const error = useNotificationStore((state) => state.error);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const fetchDropdownNotifications = useNotificationStore(
    (state) => state.fetchDropdownNotifications,
  );

  useEffect(() => {
    void fetchDropdownNotifications();
  }, [fetchDropdownNotifications]);

  async function handleOpenNotification(notification: Notification) {
    await markAsRead(notification);
    router.push(getNotificationTarget(notification));
  }

  return (
    <div className="absolute top-10 right-0 z-50 w-95 rounded-lg border border-neutral-700 bg-[#121212] text-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-bold text-2xl">Notifications</h3>

        <Link
          href="/settings?tab=notifications"
          className="text-sm font-bold text-white hover:text-neutral-400"
        >
          Settings
        </Link>
      </div>

      <div className="max-h-105 overflow-y-auto">
        {isLoading && (
          <p className="px-4 py-6 text-sm text-neutral-400">
            Loading notifications...
          </p>
        )}

        {error && <p className="px-4 py-6 text-sm text-red-400">{error}</p>}

        {!isLoading && !error && notifications.length === 0 && (
          <p className="px-4 py-6 text-sm text-neutral-400">
            No new notifications
          </p>
        )}

        {!isLoading &&
          !error &&
          notifications.slice(0, 6).map((notification) => {
            const actorName = getActorNameFromNotification(notification);
            const action = getActionText(notification);

            if (notification.type === "follow") {
              const profileSlug =
                notification.actorHandle || notification.actorId;
              return (
                <div
                  key={notification.id}
                  onClick={() => void markAsRead(notification)}
                  className={`relative border-b border-neutral-800/70 px-4 py-3 transition hover:bg-neutral-800/40 ${
                    notification.isRead ? "opacity-70" : ""
                  }`}
                >
                  {!notification.isRead && (
                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#ff5500]" />
                  )}

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pr-4 [&_p]:text-left [&_span]:text-left [&>div]:justify-start"
                  >
                    <UserCard
                      compact
                      user={mapFollowNotificationToUserCard(notification)}
                    />
                  </div>

                  <div className="mt-1 flex items-center gap-1 pl-13 text-xs text-neutral-400">
                    <MdPersonOutline className="h-3.5 w-3.5" />
                    <span>{getRelativeTime(notification.createdAt)}</span>
                  </div>
                </div>
              );
            }

            return (
              <button
                type="button"
                key={notification.id}
                onClick={() => handleOpenNotification(notification)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-neutral-800 ${
                  notification.isRead ? "opacity-70" : ""
                }`}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-700">
                  {notification.actorAvatarUrl ? (
                    <Image
                      src={notification.actorAvatarUrl}
                      alt={actorName}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/images/profile.png"
                      alt={actorName}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold text-white">
                      {actorName}
                    </span>{" "}
                    <span className="text-neutral-300">{action}</span>
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                    <MdPersonOutline className="h-3.5 w-3.5" />
                    <span>{getRelativeTime(notification.createdAt)}</span>
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      <div className="border-t border-neutral-800">
        <Link
          href="/notifications"
          className="block px-4 py-3 text-center text-sm font-semibold text-white hover:bg-neutral-800"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
