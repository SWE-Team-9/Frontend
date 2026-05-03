import { renderHook, act } from "@testing-library/react";
import { useNotificationsBoot } from "@/src/hooks/useNotificationsBoot";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useNotificationsSocket } from "@/src/hooks/useNotificationsSocket";

jest.mock("@/src/store/notificationsStore", () => ({
  useNotificationStore: jest.fn(),
}));

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/src/hooks/useNotificationsSocket", () => ({
  useNotificationsSocket: jest.fn(),
}));

const mockedUseNotificationStore = useNotificationStore as unknown as jest.Mock;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseNotificationsSocket = useNotificationsSocket as jest.MockedFunction<typeof useNotificationsSocket>;

function setupMocks({
  isAuthenticated = true,
  seededFromBootstrap = false,
  fetchNotifications = jest.fn().mockResolvedValue(undefined),
  refreshUnreadCount = jest.fn().mockResolvedValue(undefined),
  handleSocketEvent = jest.fn(),
} = {}) {
  mockedUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ isAuthenticated }),
  );

  mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) => {
    const state = {
      fetchNotifications,
      refreshUnreadCount,
      seededFromBootstrap,
      handleSocketEvent,
    };
    return selector(state);
  });

  return { fetchNotifications, refreshUnreadCount, handleSocketEvent };
}

describe("useNotificationsBoot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNotificationsSocket.mockImplementation(() => undefined);
  });

  it("calls fetchNotifications and refreshUnreadCount when authenticated and not seeded", async () => {
    const { fetchNotifications, refreshUnreadCount } = setupMocks({
      isAuthenticated: true,
      seededFromBootstrap: false,
    });

    await act(async () => {
      renderHook(() => useNotificationsBoot());
    });

    expect(fetchNotifications).toHaveBeenCalledWith({ page: 1 });
    expect(refreshUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("skips fetchNotifications and refreshUnreadCount when seededFromBootstrap is true", async () => {
    const { fetchNotifications, refreshUnreadCount } = setupMocks({
      isAuthenticated: true,
      seededFromBootstrap: true,
    });

    await act(async () => {
      renderHook(() => useNotificationsBoot());
    });

    expect(fetchNotifications).not.toHaveBeenCalled();
    expect(refreshUnreadCount).not.toHaveBeenCalled();
  });

  it("skips fetchNotifications and refreshUnreadCount when not authenticated", async () => {
    const { fetchNotifications, refreshUnreadCount } = setupMocks({
      isAuthenticated: false,
      seededFromBootstrap: false,
    });

    await act(async () => {
      renderHook(() => useNotificationsBoot());
    });

    expect(fetchNotifications).not.toHaveBeenCalled();
    expect(refreshUnreadCount).not.toHaveBeenCalled();
  });

  it("calls useNotificationsSocket with enabled: true when authenticated", async () => {
    const { handleSocketEvent } = setupMocks({ isAuthenticated: true });

    await act(async () => {
      renderHook(() => useNotificationsBoot());
    });

    expect(mockedUseNotificationsSocket).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, onEvent: handleSocketEvent }),
    );
  });

  it("calls useNotificationsSocket with enabled: false when not authenticated", async () => {
    setupMocks({ isAuthenticated: false });

    await act(async () => {
      renderHook(() => useNotificationsBoot());
    });

    expect(mockedUseNotificationsSocket).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("re-triggers effect when isAuthenticated changes to true", async () => {
    let isAuthenticated = false;
    const fetchNotifications = jest.fn().mockResolvedValue(undefined);
    const refreshUnreadCount = jest.fn().mockResolvedValue(undefined);
    const handleSocketEvent = jest.fn();

    mockedUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ isAuthenticated }),
    );
    mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ fetchNotifications, refreshUnreadCount, seededFromBootstrap: false, handleSocketEvent }),
    );

    const { rerender } = renderHook(() => useNotificationsBoot());
    expect(fetchNotifications).not.toHaveBeenCalled();

    isAuthenticated = true;
    mockedUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ isAuthenticated: true }),
    );

    await act(async () => {
      rerender();
    });

    expect(fetchNotifications).toHaveBeenCalled();
  });

  it("does not call fetch when seeded changes from false to true mid-render", async () => {
    let seededFromBootstrap = false;
    const fetchNotifications = jest.fn().mockResolvedValue(undefined);
    const refreshUnreadCount = jest.fn().mockResolvedValue(undefined);

    mockedUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ isAuthenticated: true }),
    );
    mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ fetchNotifications, refreshUnreadCount, seededFromBootstrap, handleSocketEvent: jest.fn() }),
    );

    const { rerender } = renderHook(() => useNotificationsBoot());

    jest.clearAllMocks();
    seededFromBootstrap = true;
    mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ fetchNotifications, refreshUnreadCount, seededFromBootstrap: true, handleSocketEvent: jest.fn() }),
    );

    await act(async () => {
      rerender();
    });

    expect(fetchNotifications).not.toHaveBeenCalled();
    expect(refreshUnreadCount).not.toHaveBeenCalled();
  });
});
