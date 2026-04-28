"use client";

import { useNotificationStore } from "@/src/store/notificationsStore";
import { NotificationReadStatus } from "@/src/types/notifications";

const statusFilters: NotificationReadStatus[] = ["all", "unread", "read"];

export function NotificationFilters() {
  const selectedStatus = useNotificationStore((state) => state.selectedStatus);
  const setSelectedStatus = useNotificationStore((state) => state.setSelectedStatus);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-800 p-4">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              selectedStatus === status
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={markAllAsRead}
        className="rounded-full bg-[#ff5500] px-4 py-2 text-sm font-bold text-white hover:bg-[#ff3300]"
      >
        Mark all as read
      </button>
    </div>
  );
}