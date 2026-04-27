"use client";

import { useRouter } from "next/navigation";
import { Notification } from "@/src/types/notifications";
import { useNotificationStore } from "@/src/store/notificationsStore";

interface NotificationItemProps {
  notification: Notification;
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

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    await removeNotification(notification.id);
  }

  return (
    <div onClick={handleOpen} className="cursor-pointer px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white">{notification.message}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 rounded-full bg-[#ff5500]" />
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="text-sm font-bold text-neutral-500 hover:text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
