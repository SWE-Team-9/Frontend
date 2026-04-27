"use client";

import { useEffect, useState } from "react";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { NotificationDropdown } from "@/src/components/notifications/NotificationDropdown";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const latestToastMessage = useNotificationStore((state) => state.latestToastMessage);
  const clearLatestToastMessage = useNotificationStore(
    (state) => state.clearLatestToastMessage
  );

  useEffect(() => {
    if (!latestToastMessage) return;

    const timer = setTimeout(() => {
      clearLatestToastMessage();
    }, 4000);

    return () => clearTimeout(timer);
  }, [latestToastMessage, clearLatestToastMessage]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-full p-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
        aria-label="Notifications"
      >
        <span className="text-xl">Bell</span>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff5500] px-1.5 py-0.5 text-center text-xs font-bold text-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown />}

      {latestToastMessage && (
        <div className="fixed right-6 top-20 z-50 w-80 rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white shadow-2xl">
          {latestToastMessage}
        </div>
      )}
    </div>
  );
}