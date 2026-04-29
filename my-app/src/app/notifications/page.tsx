"use client";
import { NotificationFilters } from "@/src/components/notifications/NotificationFilters";
import { NotificationItem } from "@/src/components/notifications/NotificationItem";
import { NotificationTypeDropdown } from "@/src/components/notifications/NotificationTypeDropdown";
import { useNotificationStore } from "@/src/store/notificationsStore";

export default function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const error = useNotificationStore((state) => state.error);
  const total = useNotificationStore((state) => state.total);
  const page = useNotificationStore((state) => state.page);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-[#121212]">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-800 p-5">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <NotificationTypeDropdown />
      </div>
      <NotificationFilters />
      <div>
        {isLoading && (
          <div className="p-6 text-sm text-neutral-400">
            Loading notifications...
          </div>
        )}
        {error && <div className="p-6 text-sm text-red-400">{error}</div>}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="p-6 text-sm text-neutral-400">
            No notifications found.
          </div>
        )}
        {!isLoading &&
          !error &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-neutral-800 p-4">
          <span className="text-xs text-neutral-500">
            Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => fetchNotifications({ page: page - 1 })}
              className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: Math.max(1, Math.ceil(total / 20)) }).map(
              (_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === page;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => fetchNotifications({ page: pageNumber })}
                    className={`h-8 w-8 rounded-full text-sm font-semibold ${
                      isActive
                        ? "bg-[#ff5500] text-white"
                        : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              },
            )}

            <button
              type="button"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => fetchNotifications({ page: page + 1 })}
              className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
