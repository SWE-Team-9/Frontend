import api from "@/src/services/api";
import {
  normalizeNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushNotificationDevice,
  removePushNotificationDevice,
} from "@/src/services/notificationsService";

jest.mock("@/src/services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("@/src/services/mocks/notificationsMocks", () => ({
  mockGetNotifications: jest.fn(),
  mockGetUnreadCount: jest.fn(),
  mockMarkAsRead: jest.fn(),
  mockMarkAllAsRead: jest.fn(),
  mockDeleteNotification: jest.fn(),
  mockGetPreferences: jest.fn(),
  mockUpdatePreferences: jest.fn(),
  mockRegisterPushDevice: jest.fn(),
  mockRemovePushDevice: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const BASE_DATE = "2024-01-15T10:00:00.000Z";

function makeRawNotification(overrides = {}) {
  return {
    id: "notif-1",
    type: "like",
    message: "Alice liked your track",
    actorId: "actor-1",
    actorDisplayName: "Alice",
    actorHandle: "alice",
    actorAvatarUrl: "https://example.com/alice.jpg",
    entityType: "track",
    entityId: "track-1",
    isRead: false,
    createdAt: BASE_DATE,
    ...overrides,
  };
}

describe("normalizeNotification", () => {
  it("normalizes a fully-populated camelCase notification", () => {
    const result = normalizeNotification(makeRawNotification());
    expect(result).toEqual({
      id: "notif-1",
      type: "like",
      message: "Alice liked your track",
      actorId: "actor-1",
      actorDisplayName: "Alice",
      actorHandle: "alice",
      actorAvatarUrl: "https://example.com/alice.jpg",
      entityType: "track",
      entityId: "track-1",
      isRead: false,
      createdAt: BASE_DATE,
    });
  });

  it("normalizes snake_case fields", () => {
    const raw = {
      id: "n1",
      type: "comment",
      message: "Bob commented",
      actor_id: "actor-2",
      actor_display_name: "Bob",
      actor_handle: "bob",
      actor_avatar_url: "https://example.com/bob.jpg",
      entity_type: "track",
      entity_id: "track-2",
      is_read: true,
      created_at: BASE_DATE,
    };
    const result = normalizeNotification(raw);
    expect(result.actorId).toBe("actor-2");
    expect(result.actorDisplayName).toBe("Bob");
    expect(result.actorHandle).toBe("bob");
    expect(result.actorAvatarUrl).toBe("https://example.com/bob.jpg");
    expect(result.entityType).toBe("track");
    expect(result.entityId).toBe("track-2");
    expect(result.isRead).toBe(true);
    expect(result.createdAt).toBe(BASE_DATE);
  });

  it("resolves actor fields from nested actor object", () => {
    const raw = {
      id: "n2",
      type: "follow",
      actor: {
        id: "actor-3",
        displayName: "Carol",
        handle: "carol",
        avatarUrl: "https://example.com/carol.jpg",
      },
    };
    const result = normalizeNotification(raw);
    expect(result.actorId).toBe("actor-3");
    expect(result.actorDisplayName).toBe("Carol");
    expect(result.actorHandle).toBe("carol");
    expect(result.actorAvatarUrl).toBe("https://example.com/carol.jpg");
  });

  it("resolves actor fields from nested user object", () => {
    const raw = {
      id: "n3",
      type: "repost",
      user: {
        userId: "actor-4",
        name: "Dave",
        username: "dave",
        profile_image_url: "https://example.com/dave.jpg",
      },
    };
    const result = normalizeNotification(raw);
    expect(result.actorId).toBe("actor-4");
    expect(result.actorDisplayName).toBe("Dave");
    expect(result.actorHandle).toBe("dave");
    expect(result.actorAvatarUrl).toBe("https://example.com/dave.jpg");
  });

  it("resolves actor fields from nested sender object", () => {
    const raw = {
      id: "n4",
      type: "like",
      sender: {
        actor_id: "actor-5",
        display_name: "Eve",
        username: "eve",
        imageUrl: "https://example.com/eve.jpg",
      },
    };
    const result = normalizeNotification(raw);
    expect(result.actorId).toBe("actor-5");
    expect(result.actorDisplayName).toBe("Eve");
  });

  it("falls back id to _id", () => {
    const raw = { _id: "mongo-id", type: "like", createdAt: BASE_DATE };
    const result = normalizeNotification(raw);
    expect(result.id).toBe("mongo-id");
  });

  it("generates a composite id when no id fields are present", () => {
    const raw = { type: "like", entityId: "track-x", createdAt: BASE_DATE };
    const result = normalizeNotification(raw);
    expect(result.id).toContain("like");
    expect(result.id).toContain("track-x");
  });

  it("defaults type to 'like' for unknown types", () => {
    const raw = makeRawNotification({ type: "UNKNOWN_TYPE" });
    expect(normalizeNotification(raw).type).toBe("like");
  });

  it("normalizes uppercase type to lowercase", () => {
    const raw = makeRawNotification({ type: "FOLLOW" });
    expect(normalizeNotification(raw).type).toBe("follow");
  });

  it("handles all valid types: like, comment, follow, repost", () => {
    for (const type of ["like", "comment", "follow", "repost"]) {
      expect(normalizeNotification(makeRawNotification({ type })).type).toBe(type);
    }
  });

  it("defaults entityType to 'user' for follow notifications", () => {
    const raw = makeRawNotification({ type: "follow", entityType: undefined });
    expect(normalizeNotification(raw).entityType).toBe("user");
  });

  it("defaults entityType to 'track' for non-follow notifications", () => {
    const raw = makeRawNotification({ type: "like", entityType: undefined });
    expect(normalizeNotification(raw).entityType).toBe("track");
  });

  it("handles all valid entityTypes", () => {
    for (const entityType of ["track", "user", "comment", "playlist"]) {
      const raw = makeRawNotification({ entityType });
      expect(normalizeNotification(raw).entityType).toBe(entityType);
    }
  });

  it("defaults isRead to false when not provided", () => {
    const raw = makeRawNotification({ isRead: undefined });
    expect(normalizeNotification(raw).isRead).toBe(false);
  });

  it("preserves isRead: true", () => {
    expect(normalizeNotification(makeRawNotification({ isRead: true })).isRead).toBe(true);
  });

  it("uses is_read fallback", () => {
    const raw = { ...makeRawNotification({ isRead: undefined }), is_read: true };
    expect(normalizeNotification(raw).isRead).toBe(true);
  });

  it("defaults actorAvatarUrl to null when not provided", () => {
    const raw = makeRawNotification({ actorAvatarUrl: undefined });
    expect(normalizeNotification(raw).actorAvatarUrl).toBeNull();
  });

  it("preserves explicit null actorAvatarUrl", () => {
    const raw = makeRawNotification({ actorAvatarUrl: null });
    expect(normalizeNotification(raw).actorAvatarUrl).toBeNull();
  });

  it("picks actorAvatarUrl from actor.image_url as fallback", () => {
    const raw = {
      id: "n5",
      type: "like",
      actor: { id: "a1", image_url: "https://example.com/img.jpg" },
      createdAt: BASE_DATE,
    };
    expect(normalizeNotification(raw).actorAvatarUrl).toBe("https://example.com/img.jpg");
  });

  it("uses timestamp field for createdAt", () => {
    const raw = { ...makeRawNotification({ createdAt: undefined }), timestamp: BASE_DATE };
    expect(normalizeNotification(raw).createdAt).toBe(BASE_DATE);
  });

  it("uses time field for createdAt", () => {
    const raw = { ...makeRawNotification({ createdAt: undefined }), time: BASE_DATE };
    expect(normalizeNotification(raw).createdAt).toBe(BASE_DATE);
  });

  it("generates a current ISO timestamp when no date field exists", () => {
    const before = Date.now();
    const raw = makeRawNotification({ createdAt: undefined });
    const result = normalizeNotification(raw);
    const after = Date.now();
    const ts = new Date(result.createdAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("defaults message to empty string when absent", () => {
    const raw = makeRawNotification({ message: undefined });
    expect(normalizeNotification(raw).message).toBe("");
  });

  it("uses text field as fallback for message", () => {
    const raw = { ...makeRawNotification({ message: undefined }), text: "fallback" };
    expect(normalizeNotification(raw).message).toBe("fallback");
  });

  it("falls back entityId to actorId when entity fields are absent", () => {
    const raw = makeRawNotification({ entityId: undefined, entity_id: undefined });
    expect(normalizeNotification(raw).entityId).toBe(raw.actorId);
  });

  it("uses targetId for entityId when entityId is absent", () => {
    const raw = { ...makeRawNotification({ entityId: undefined }), targetId: "target-99" };
    expect(normalizeNotification(raw).entityId).toBe("target-99");
  });

  it("handles null payload gracefully", () => {
    const result = normalizeNotification(null);
    expect(result.type).toBe("like");
    expect(result.actorId).toBe("");
    expect(result.isRead).toBe(false);
  });

  it("handles undefined payload gracefully", () => {
    const result = normalizeNotification(undefined);
    expect(result.type).toBe("like");
  });

  it("handles empty object payload", () => {
    const result = normalizeNotification({});
    expect(result).toBeDefined();
  });

  it("skips empty-string values in pickString", () => {
    const raw = makeRawNotification({ actorHandle: "  " });
    expect(normalizeNotification(raw).actorHandle).toBeUndefined();
  });
});

describe("getNotifications", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_USE_MOCK;
  });

  it("calls api.get with correct params and normalizes response", async () => {
    const rawResponse = {
      page: 1,
      limit: 20,
      total: 2,
      notifications: [
        makeRawNotification({ id: "a" }),
        makeRawNotification({ id: "b" }),
      ],
    };
    mockedApi.get.mockResolvedValueOnce({ data: rawResponse });

    const result = await getNotifications({ page: 1, limit: 20 });

    expect(mockedApi.get).toHaveBeenCalledWith("/notifications", {
      params: {
        page: 1,
        limit: 20,
        type: undefined,
        isRead: undefined,
      },
    });
    expect(result.notifications).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.total).toBe(2);
  });

  it("maps type filter to uppercase for the API", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { page: 1, limit: 20, total: 0, notifications: [] },
    });
    await getNotifications({ type: "like" });
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({
        params: expect.objectContaining({ type: "LIKE" }),
      }),
    );
  });

  it("maps status 'read' to isRead: true", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { page: 1, limit: 20, total: 0, notifications: [] },
    });
    await getNotifications({ status: "read" });
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({
        params: expect.objectContaining({ isRead: true }),
      }),
    );
  });

  it("maps status 'unread' to isRead: false", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { page: 1, limit: 20, total: 0, notifications: [] },
    });
    await getNotifications({ status: "unread" });
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({
        params: expect.objectContaining({ isRead: false }),
      }),
    );
  });

  it("handles empty notifications array", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { page: 1, limit: 20, total: 0, notifications: [] },
    });
    const result = await getNotifications();
    expect(result.notifications).toEqual([]);
  });

  it("handles missing notifications field in response", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: {} });
    const result = await getNotifications();
    expect(result.notifications).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("getUnreadNotificationCount", () => {
  it("calls api.get and returns count", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { count: 7 } });
    const result = await getUnreadNotificationCount();
    expect(mockedApi.get).toHaveBeenCalledWith("/notifications/unread-count");
    expect(result.count).toBe(7);
  });
});

describe("markNotificationAsRead", () => {
  it("calls api.patch with correct url", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { message: "marked" } });
    const result = await markNotificationAsRead("notif-123");
    expect(mockedApi.patch).toHaveBeenCalledWith("/notifications/notif-123/read");
    expect(result.message).toBe("marked");
  });
});

describe("markAllNotificationsAsRead", () => {
  it("calls api.patch with read-all endpoint", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { message: "all read" } });
    const result = await markAllNotificationsAsRead();
    expect(mockedApi.patch).toHaveBeenCalledWith("/notifications/read-all");
    expect(result.message).toBe("all read");
  });
});

describe("deleteNotification", () => {
  it("calls api.delete with correct url", async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: undefined });
    await deleteNotification("notif-456");
    expect(mockedApi.delete).toHaveBeenCalledWith("/notifications/notif-456");
  });
});

describe("getNotificationPreferences", () => {
  it("calls api.get and returns preferences", async () => {
    const prefs = { likes: true, comments: false, follows: true, reposts: false };
    mockedApi.get.mockResolvedValueOnce({ data: prefs });
    const result = await getNotificationPreferences();
    expect(mockedApi.get).toHaveBeenCalledWith("/notifications/preferences");
    expect(result).toEqual(prefs);
  });
});

describe("updateNotificationPreferences", () => {
  it("calls api.put with preferences payload", async () => {
    const prefs = { likes: false, comments: true, follows: false, reposts: true };
    mockedApi.put.mockResolvedValueOnce({ data: { message: "updated" } });
    const result = await updateNotificationPreferences(prefs);
    expect(mockedApi.put).toHaveBeenCalledWith("/notifications/preferences", prefs);
    expect(result.message).toBe("updated");
  });
});

describe("registerPushNotificationDevice", () => {
  it("calls api.post with device payload", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { message: "registered" } });
    const result = await registerPushNotificationDevice({
      deviceToken: "tok123",
      platform: "web",
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/notifications/push/register",
      { deviceToken: "tok123", platform: "web" },
    );
    expect(result.message).toBe("registered");
  });
});

describe("removePushNotificationDevice", () => {
  it("calls api.delete with device id", async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: { message: "removed" } });
    const result = await removePushNotificationDevice("device-7");
    expect(mockedApi.delete).toHaveBeenCalledWith("/notifications/push/device-7");
    expect(result.message).toBe("removed");
  });
});
