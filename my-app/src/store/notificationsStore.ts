import { create } from "zustand";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotification,
} from "@/src/services/notificationsService";
import {
  GetNotificationsParams,
  Notification,
  NotificationReadStatus,
  NotificationSocketEvent,
  NotificationType,
} from "@/src/types/notifications";

interface NotificationState {
  notifications: Notification[];
  dropdownNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  total: number;
  selectedType: NotificationType | "all";
  selectedStatus: NotificationReadStatus;
  latestToastMessage: string | null;
  // Set to true after bootstrap seeds initial data; prevents useNotificationsBoot
  // from making redundant /notifications + /notifications/unread-count requests.
  seededFromBootstrap: boolean;

  fetchDropdownNotifications: () => Promise<void>;
  setSelectedType: (type: NotificationType | "all") => void;
  setSelectedStatus: (status: NotificationReadStatus) => void;
  fetchNotifications: (params?: GetNotificationsParams) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  setFromBootstrap: (unreadCount: number, latest: unknown[]) => void;
  markAsRead: (notification: Notification) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  handleSocketEvent: (event: NotificationSocketEvent) => void;
  clearLatestToastMessage: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [] as Notification[],
  dropdownNotifications: [] as Notification[],
  unreadCount: 0,
  isLoading: false,
  error: null as string | null,
  page: 1,
  total: 0,
  selectedType: "all" as NotificationType | "all",
  selectedStatus: "all" as NotificationReadStatus,
  latestToastMessage: null as string | null,
  seededFromBootstrap: false,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  setSelectedType: (type) => {
    set({ selectedType: type, page: 1 });
    void get().fetchNotifications({ page: 1 });
  },

  setSelectedStatus: (status) => {
    set({ selectedStatus: status, page: 1 });
    void get().fetchNotifications({ page: 1 });
  },

  fetchNotifications: async (params = {}) => {
    const { selectedType, selectedStatus, page } = get();

    set({ isLoading: true, error: null });

    try {
      const response = await getNotifications({
        page,
        limit: 20,
        type: selectedType === "all" ? undefined : selectedType,
        status: selectedStatus,
        ...params,
      });

      set({
        notifications: response.notifications,
        total: response.total,
        page: response.page,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load notifications",
      });
    }
  },

  fetchDropdownNotifications: async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 6 });
      set({ dropdownNotifications: response.notifications });
    } catch {
      // dropdown just shows stale data if this fails
    }
  },

  refreshUnreadCount: async () => {
    try {
      const response = await getUnreadNotificationCount();
      set({ unreadCount: response.count });
    } catch {
      return;
    }
  },

  setFromBootstrap: (unreadCount, latest) => {
    set({
      unreadCount,
      notifications: (latest as Notification[]).map(normalizeNotification),
      seededFromBootstrap: true,
    });
  },

  markAsRead: async (notification) => {
    if (notification.isRead) return;

    await markNotificationAsRead(notification.id);

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(state.unreadCount - 1, 0),
    }));
  },

  markAllAsRead: async () => {
    await markAllNotificationsAsRead();

    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        isRead: true,
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: async (notificationId) => {
    await deleteNotification(notificationId);

    set((state) => {
      const removed = state.notifications.find(
        (item) => item.id === notificationId,
      );
      const wasUnread = removed && !removed.isRead;

      return {
        notifications: state.notifications.filter(
          (item) => item.id !== notificationId,
        ),
        unreadCount: wasUnread
          ? Math.max(state.unreadCount - 1, 0)
          : state.unreadCount,
      };
    });
  },

  handleSocketEvent: (event) => {
    set({ unreadCount: event.currentUnreadCount });

    if (event.type === "NEW_NOTIFICATION") {
      if (event.message) {
        set({ latestToastMessage: event.message });
      }

      if (event.type === "NEW_NOTIFICATION") {
        if (event.message) {
          set({ latestToastMessage: event.message });
        }

        if (event.notification) {
          set((state) => ({
            notifications: [
              normalizeNotification(event.notification),
              ...state.notifications,
            ],
            dropdownNotifications: [
              normalizeNotification(event.notification),
              ...state.dropdownNotifications,
            ].slice(0, 6),
          }));
        } else {
          void get().fetchNotifications({ page: 1 });
          void get().fetchDropdownNotifications();
        }
      }
    }

    if (event.type === "ALL_NOTIFICATIONS_READ") {
      set((state) => ({
        notifications: state.notifications.map((item) => ({
          ...item,
          isRead: true,
        })),
      }));
    }

    if (event.type === "NOTIFICATION_READ" && event.notificationId) {
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === event.notificationId ? { ...item, isRead: true } : item,
        ),
      }));
    }

    if (event.type === "NOTIFICATION_DELETED" && event.notificationId) {
      set((state) => ({
        notifications: state.notifications.filter(
          (item) => item.id !== event.notificationId,
        ),
      }));
    }
  },

  clearLatestToastMessage: () => set({ latestToastMessage: null }),

  reset: () => set({ ...initialState, seededFromBootstrap: false }),
}));
