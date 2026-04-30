"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdPersonOutline } from "react-icons/md";
import { UserCard, UserCardUser } from "@/src/components/user/UserCard";
import { Notification } from "@/src/types/notifications";
import { useNotificationStore } from "@/src/store/notificationsStore";

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

  if (match?.[1]) return match[1].trim() || "Someone";
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
  if (notification.entityType === "playlist") {
    return `/library/playlists`;
  }
  return `/notifications`;
}

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );

  async function handleOpen() {
    await markAsRead(notification);
    router.push(getNotificationTarget(notification));
  }

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    await removeNotification(notification.id);
  }

  const actorName = getActorNameFromNotification(notification);
  const action = getActionText(notification);

  if (notification.type === "follow") {
    return (
      <div
        className={`relative border-b border-neutral-800/70 px-4 py-3 transition hover:bg-neutral-800/40 ${
          notification.isRead ? "opacity-70" : ""
        }`}
      >
        {!notification.isRead && (
          <span className="absolute right-16 top-4 h-2 w-2 rounded-full bg-[#ff5500]" />
        )}

        <div className="flex items-start justify-between gap-2">
          <div
            onClick={handleOpen}
            className="flex-1 cursor-pointer pr-2 [&_p]:text-left [&_span]:text-left [&>div]:justify-start"
          >
            <UserCard
              compact
              user={mapFollowNotificationToUserCard(notification)}
            />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 text-sm font-bold text-neutral-500 hover:text-white"
          >
            Delete
          </button>
        </div>

        <div className="mt-1 flex items-center gap-1 pl-13 text-xs text-neutral-400">
          <MdPersonOutline className="h-3.5 w-3.5" />
          <span>{getRelativeTime(notification.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative border-b border-neutral-800/70 px-4 py-3 transition hover:bg-neutral-800/40 ${
        notification.isRead ? "opacity-70" : ""
      }`}
    >
      {!notification.isRead && (
        <span className="absolute right-16 top-4 h-2 w-2 rounded-full bg-[#ff5500]" />
      )}

      <div className="flex items-start gap-3">
        <div
          onClick={handleOpen}
          className="flex flex-1 cursor-pointer items-start gap-3"
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
              <span className="font-semibold text-white">{actorName}</span>{" "}
              <span className="text-neutral-300">{action}</span>
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
              <MdPersonOutline className="h-3.5 w-3.5" />
              <span>{getRelativeTime(notification.createdAt)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 text-sm font-bold text-neutral-500 hover:text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}