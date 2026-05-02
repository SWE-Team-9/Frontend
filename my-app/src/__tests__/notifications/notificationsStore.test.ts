import { act } from "@testing-library/react";
import { useNotificationStore } from "@/src/store/notificationsStore";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotification,
} from "@/src/services/notificationsService";
import { Notification, NotificationSocketEvent } from "@/src/types/notifications";

jest.mock("@/src/services/notificationsService", () => ({
  getNotifications: jest.fn(),
  getUnreadNotificationCount: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  normalizeNotification: jest.fn((n) => n),
}));

const mockedGetNotifications = getNotifications as jest.MockedFunction<typeof getNotifications>;
const mockedGetUnreadCount = getUnreadNotificationCount as jest.MockedFunction<typeof getUnreadNotificationCount>;
const mockedMarkAsRead = markNotificationAsRead as jest.MockedFunction<typeof markNotificationAsRead>;
const mockedMarkAllAsRead = markAllNotificationsAsRead as jest.MockedFunction<typeof markAllNotificationsAsRead>;
const mockedDeleteNotification = deleteNotification as jest.MockedFunction<typeof deleteNotification>;
const mockedNormalizeNotification = normalizeNotification as jest.MockedFunction<typeof normalizeNotification>;

const BASE_DATE = "2024-01-15T10:00:00.000Z";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    type: "like",
    message: "Alice liked your track",
    actorId: "actor-1",
    actorDisplayName: "Alice",
    actorHandle: "alice",
    actorAvatarUrl: null,
    entityType: "track",
    entityId: "track-1",
    isRead: false,
    createdAt: BASE_DATE,
    ...overrides,
  };
}

function makeResponse(notifications: Notification[] = [makeNotification()]) {
  return {
    notifications,
    page: 1,
    limit: 20,
    total: notifications.length,
  };
}

beforeEach(() => {
  act(() => {
    useNotificationStore.getState().reset();
  });
  jest.clearAllMocks();
  mockedNormalizeNotification.mockImplementation((n) => n as Notification);
});

describe("initial state", () => {
  it("has correct defaults", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.dropdownNotifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.page).toBe(1);
    expect(state.total).toBe(0);
    expect(state.selectedType).toBe("all");
    expect(state.selectedStatus).toBe("all");
    expect(state.latestToastMessage).toBeNull();
    expect(state.seededFromBootstrap).toBe(false);
  });
});

describe("fetchNotifications", () => {
  it("sets isLoading true then false on success", async () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    const promise = act(() => useNotificationStore.getState().fetchNotifications());
    expect(useNotificationStore.getState().isLoading).toBe(true);
    await promise;
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it("stores notifications on success", async () => {
    const notifs = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    mockedGetNotifications.mockResolvedValueOnce(makeResponse(notifs));
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(useNotificationStore.getState().notifications).toEqual(notifs);
    expect(useNotificationStore.getState().total).toBe(2);
  });

  it("sets error state on failure", async () => {
    mockedGetNotifications.mockRejectedValueOnce(new Error("Network error"));
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(useNotificationStore.getState().error).toBe("Network error");
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it("sets generic error message for non-Error rejection", async () => {
    mockedGetNotifications.mockRejectedValueOnce("boom");
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(useNotificationStore.getState().error).toBe("Failed to load notifications");
  });

  it("passes selectedType filter (non-all)", async () => {
    act(() => useNotificationStore.setState({ selectedType: "like" }));
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: "like" }),
    );
  });

  it("passes undefined type when selectedType is 'all'", async () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: undefined }),
    );
  });

  it("passes selectedStatus filter (non-all)", async () => {
    act(() => useNotificationStore.setState({ selectedStatus: "unread" }));
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().fetchNotifications());
    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ status: "unread" }),
    );
  });

  it("overrides page via params", async () => {
    mockedGetNotifications.mockResolvedValueOnce({ ...makeResponse(), page: 3 });
    await act(() => useNotificationStore.getState().fetchNotifications({ page: 3 }));
    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });
});

describe("fetchDropdownNotifications", () => {
  it("sets dropdownNotifications on success", async () => {
    const notifs = [makeNotification({ id: "d1" })];
    mockedGetNotifications.mockResolvedValueOnce(makeResponse(notifs));
    await act(() => useNotificationStore.getState().fetchDropdownNotifications());
    expect(useNotificationStore.getState().dropdownNotifications).toEqual(notifs);
  });

  it("swallows errors silently (stale data stays)", async () => {
    const existing = [makeNotification({ id: "existing" })];
    act(() => useNotificationStore.setState({ dropdownNotifications: existing }));
    mockedGetNotifications.mockRejectedValueOnce(new Error("fail"));
    await act(() => useNotificationStore.getState().fetchDropdownNotifications());
    expect(useNotificationStore.getState().dropdownNotifications).toEqual(existing);
  });

  it("calls getNotifications with limit 6", async () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().fetchDropdownNotifications());
    expect(mockedGetNotifications).toHaveBeenCalledWith({ page: 1, limit: 6 });
  });
});

describe("refreshUnreadCount", () => {
  it("updates unreadCount on success", async () => {
    mockedGetUnreadCount.mockResolvedValueOnce({ count: 5 });
    await act(() => useNotificationStore.getState().refreshUnreadCount());
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it("swallows errors silently", async () => {
    act(() => useNotificationStore.setState({ unreadCount: 3 }));
    mockedGetUnreadCount.mockRejectedValueOnce(new Error("fail"));
    await act(() => useNotificationStore.getState().refreshUnreadCount());
    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });
});

describe("setFromBootstrap", () => {
  it("sets unreadCount, normalizes notifications and marks seeded", () => {
    const raw = [makeNotification({ id: "boot-1" })];
    act(() => useNotificationStore.getState().setFromBootstrap(8, raw));
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(8);
    expect(state.seededFromBootstrap).toBe(true);
    expect(state.notifications).toHaveLength(1);
  });
});

describe("markAsRead", () => {
  it("does nothing if notification is already read", async () => {
    const notif = makeNotification({ isRead: true });
    await act(() => useNotificationStore.getState().markAsRead(notif));
    expect(mockedMarkAsRead).not.toHaveBeenCalled();
  });

  it("marks notification as read in store and decrements unreadCount", async () => {
    const notif = makeNotification({ id: "n1", isRead: false });
    act(() => useNotificationStore.setState({ notifications: [notif], unreadCount: 3 }));
    mockedMarkAsRead.mockResolvedValueOnce({ message: "ok" });

    await act(() => useNotificationStore.getState().markAsRead(notif));

    const state = useNotificationStore.getState();
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(2);
  });

  it("does not decrement unreadCount below 0", async () => {
    const notif = makeNotification({ isRead: false });
    act(() => useNotificationStore.setState({ notifications: [notif], unreadCount: 0 }));
    mockedMarkAsRead.mockResolvedValueOnce({ message: "ok" });

    await act(() => useNotificationStore.getState().markAsRead(notif));
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});

describe("markAllAsRead", () => {
  it("marks all notifications as read and resets unreadCount", async () => {
    const notifs = [
      makeNotification({ id: "n1", isRead: false }),
      makeNotification({ id: "n2", isRead: false }),
    ];
    act(() => useNotificationStore.setState({ notifications: notifs, unreadCount: 2 }));
    mockedMarkAllAsRead.mockResolvedValueOnce({ message: "ok" });

    await act(() => useNotificationStore.getState().markAllAsRead());

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });
});

describe("removeNotification", () => {
  it("removes notification and decrements unreadCount for unread", async () => {
    const notifs = [
      makeNotification({ id: "n1", isRead: false }),
      makeNotification({ id: "n2", isRead: true }),
    ];
    act(() => useNotificationStore.setState({ notifications: notifs, unreadCount: 1 }));
    mockedDeleteNotification.mockResolvedValueOnce(undefined);

    await act(() => useNotificationStore.getState().removeNotification("n1"));

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe("n2");
    expect(state.unreadCount).toBe(0);
  });

  it("removes notification without changing unreadCount for already-read notification", async () => {
    const notifs = [makeNotification({ id: "n1", isRead: true })];
    act(() => useNotificationStore.setState({ notifications: notifs, unreadCount: 2 }));
    mockedDeleteNotification.mockResolvedValueOnce(undefined);

    await act(() => useNotificationStore.getState().removeNotification("n1"));
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("handles removing a non-existent notification id gracefully", async () => {
    const notifs = [makeNotification({ id: "n1" })];
    act(() => useNotificationStore.setState({ notifications: notifs, unreadCount: 1 }));
    mockedDeleteNotification.mockResolvedValueOnce(undefined);

    await act(() => useNotificationStore.getState().removeNotification("ghost-id"));
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});

describe("setSelectedType", () => {
  it("updates selectedType and resets page to 1", () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    act(() => useNotificationStore.getState().setSelectedType("comment"));
    expect(useNotificationStore.getState().selectedType).toBe("comment");
    expect(useNotificationStore.getState().page).toBe(1);
  });

  it("triggers fetchNotifications after setting type", async () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().setSelectedType("follow"));
    expect(mockedGetNotifications).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });
});

describe("setSelectedStatus", () => {
  it("updates selectedStatus and resets page to 1", () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    act(() => useNotificationStore.getState().setSelectedStatus("unread"));
    expect(useNotificationStore.getState().selectedStatus).toBe("unread");
    expect(useNotificationStore.getState().page).toBe(1);
  });

  it("triggers fetchNotifications after setting status", async () => {
    mockedGetNotifications.mockResolvedValueOnce(makeResponse());
    await act(() => useNotificationStore.getState().setSelectedStatus("read"));
    expect(mockedGetNotifications).toHaveBeenCalled();
  });
});

describe("handleSocketEvent — NEW_NOTIFICATION", () => {
  it("sets unreadCount from event", () => {
    const event: NotificationSocketEvent = {
      type: "NEW_NOTIFICATION",
      currentUnreadCount: 10,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().unreadCount).toBe(10);
  });

  it("sets latestToastMessage from event.message", () => {
    const event: NotificationSocketEvent = {
      type: "NEW_NOTIFICATION",
      currentUnreadCount: 1,
      message: "You have a new like",
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().latestToastMessage).toBe("You have a new like");
  });

  it("prepends notification to notifications and dropdownNotifications when event.notification present", () => {
    const existing = [makeNotification({ id: "old-1" })];
    act(() => useNotificationStore.setState({ notifications: existing, dropdownNotifications: existing }));

    const newNotif = makeNotification({ id: "new-1" });
    mockedNormalizeNotification.mockReturnValueOnce(newNotif).mockReturnValueOnce(newNotif);

    const event: NotificationSocketEvent = {
      type: "NEW_NOTIFICATION",
      currentUnreadCount: 2,
      notification: newNotif,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));

    const state = useNotificationStore.getState();
    expect(state.notifications[0].id).toBe("new-1");
    expect(state.dropdownNotifications[0].id).toBe("new-1");
  });

  it("caps dropdownNotifications at 6 items", () => {
    const existing = Array.from({ length: 6 }, (_, i) => makeNotification({ id: `old-${i}` }));
    act(() => useNotificationStore.setState({ dropdownNotifications: existing }));

    const newNotif = makeNotification({ id: "new-overflow" });
    mockedNormalizeNotification.mockReturnValue(newNotif);

    const event: NotificationSocketEvent = {
      type: "NEW_NOTIFICATION",
      currentUnreadCount: 7,
      notification: newNotif,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().dropdownNotifications).toHaveLength(6);
  });

  it("fetches notifications when event.notification is absent", async () => {
    mockedGetNotifications.mockResolvedValue(makeResponse());
    const event: NotificationSocketEvent = {
      type: "NEW_NOTIFICATION",
      currentUnreadCount: 1,
    };
    await act(() => {
      useNotificationStore.getState().handleSocketEvent(event);
    });
    expect(mockedGetNotifications).toHaveBeenCalled();
  });
});

describe("handleSocketEvent — ALL_NOTIFICATIONS_READ", () => {
  it("marks all local notifications as read", () => {
    const notifs = [
      makeNotification({ id: "n1", isRead: false }),
      makeNotification({ id: "n2", isRead: false }),
    ];
    act(() => useNotificationStore.setState({ notifications: notifs }));

    const event: NotificationSocketEvent = {
      type: "ALL_NOTIFICATIONS_READ",
      currentUnreadCount: 0,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().notifications.every((n) => n.isRead)).toBe(true);
  });
});

describe("handleSocketEvent — NOTIFICATION_READ", () => {
  it("marks specific notification as read", () => {
    const notifs = [
      makeNotification({ id: "n1", isRead: false }),
      makeNotification({ id: "n2", isRead: false }),
    ];
    act(() => useNotificationStore.setState({ notifications: notifs }));

    const event: NotificationSocketEvent = {
      type: "NOTIFICATION_READ",
      currentUnreadCount: 1,
      notificationId: "n1",
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));

    const state = useNotificationStore.getState();
    expect(state.notifications.find((n) => n.id === "n1")?.isRead).toBe(true);
    expect(state.notifications.find((n) => n.id === "n2")?.isRead).toBe(false);
  });

  it("does nothing if notificationId is absent", () => {
    const notifs = [makeNotification({ id: "n1", isRead: false })];
    act(() => useNotificationStore.setState({ notifications: notifs }));

    const event: NotificationSocketEvent = {
      type: "NOTIFICATION_READ",
      currentUnreadCount: 1,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(false);
  });
});

describe("handleSocketEvent — NOTIFICATION_DELETED", () => {
  it("removes the notification by id", () => {
    const notifs = [
      makeNotification({ id: "n1" }),
      makeNotification({ id: "n2" }),
    ];
    act(() => useNotificationStore.setState({ notifications: notifs }));

    const event: NotificationSocketEvent = {
      type: "NOTIFICATION_DELETED",
      currentUnreadCount: 0,
      notificationId: "n1",
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe("n2");
  });

  it("does nothing if notificationId is absent", () => {
    const notifs = [makeNotification({ id: "n1" })];
    act(() => useNotificationStore.setState({ notifications: notifs }));

    const event: NotificationSocketEvent = {
      type: "NOTIFICATION_DELETED",
      currentUnreadCount: 0,
    };
    act(() => useNotificationStore.getState().handleSocketEvent(event));
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});

describe("clearLatestToastMessage", () => {
  it("clears latestToastMessage", () => {
    act(() => useNotificationStore.setState({ latestToastMessage: "Hello" }));
    act(() => useNotificationStore.getState().clearLatestToastMessage());
    expect(useNotificationStore.getState().latestToastMessage).toBeNull();
  });
});

describe("reset", () => {
  it("resets all state to initial values", () => {
    act(() => {
      useNotificationStore.setState({
        notifications: [makeNotification()],
        unreadCount: 5,
        isLoading: true,
        error: "err",
        seededFromBootstrap: true,
        latestToastMessage: "msg",
      });
    });

    act(() => useNotificationStore.getState().reset());

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.seededFromBootstrap).toBe(false);
    expect(state.latestToastMessage).toBeNull();
  });
});
