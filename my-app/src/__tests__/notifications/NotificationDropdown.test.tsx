import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationDropdown } from "@/src/components/notifications/NotificationDropdown";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { Notification } from "@/src/types/notifications";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("react-icons/md", () => ({
  MdPersonOutline: () => <span data-testid="icon-person" />,
}));

jest.mock("@/src/components/user/UserCard", () => ({
  UserCard: ({ user }: { user: { displayName: string } }) => (
    <div data-testid="user-card">{user.displayName}</div>
  ),
}));

jest.mock("@/src/store/notificationsStore", () => ({
  useNotificationStore: jest.fn(),
}));

const mockedUseNotificationStore = useNotificationStore as unknown as jest.Mock;

const BASE_DATE = new Date(Date.now() - 5 * 60 * 1000).toISOString();

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

function setupStore({
  notifications = [] as Notification[],
  isLoading = false,
  error = null as string | null,
  markAsRead = jest.fn().mockResolvedValue(undefined),
  fetchDropdownNotifications = jest.fn().mockResolvedValue(undefined),
} = {}) {
  mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ dropdownNotifications: notifications, isLoading, error, markAsRead, fetchDropdownNotifications }),
  );
  return { markAsRead, fetchDropdownNotifications };
}

describe("NotificationDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it("renders heading 'Notifications'", () => {
    setupStore();
    render(<NotificationDropdown />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders Settings link", () => {
    setupStore();
    render(<NotificationDropdown />);
    const link = screen.getByRole("link", { name: /settings/i });
    expect(link).toHaveAttribute("href", "/settings?tab=notifications");
  });

  it("renders 'View all notifications' link", () => {
    setupStore();
    render(<NotificationDropdown />);
    const link = screen.getByRole("link", { name: /view all notifications/i });
    expect(link).toHaveAttribute("href", "/notifications");
  });

  it("calls fetchDropdownNotifications on mount", () => {
    const { fetchDropdownNotifications } = setupStore();
    render(<NotificationDropdown />);
    expect(fetchDropdownNotifications).toHaveBeenCalledTimes(1);
  });

  it("shows loading message when isLoading is true", () => {
    setupStore({ isLoading: true });
    render(<NotificationDropdown />);
    expect(screen.getByText(/loading notifications/i)).toBeInTheDocument();
  });

  it("shows error message when error is set", () => {
    setupStore({ error: "Something went wrong" });
    render(<NotificationDropdown />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows 'No new notifications' when list is empty and not loading", () => {
    setupStore({ notifications: [] });
    render(<NotificationDropdown />);
    expect(screen.getByText(/no new notifications/i)).toBeInTheDocument();
  });

  it("renders notification items when present", () => {
    setupStore({ notifications: [makeNotification({ actorDisplayName: "Alice" })] });
    render(<NotificationDropdown />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders at most 6 notifications", () => {
    const notifs = Array.from({ length: 10 }, (_, i) =>
      makeNotification({ id: `n-${i}`, actorDisplayName: `User ${i}` }),
    );
    setupStore({ notifications: notifs });
    render(<NotificationDropdown />);
    expect(screen.getAllByRole("button", { name: /user \d/i })).toHaveLength(6);
  });

  it("renders follow notification using UserCard", () => {
    setupStore({
      notifications: [makeNotification({ type: "follow", entityType: "user", actorDisplayName: "Bob" })],
    });
    render(<NotificationDropdown />);
    expect(screen.getByTestId("user-card")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls markAsRead when a non-follow notification button is clicked", async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    setupStore({ notifications: [makeNotification()], markAsRead });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /alice/i }));
    await waitFor(() => expect(markAsRead).toHaveBeenCalled());
  });

  it("pushes router to notification target when notification clicked", async () => {
    setupStore({
      notifications: [makeNotification({ entityType: "track", entityId: "track-77" })],
    });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /alice/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/tracks/track-77"));
  });

  it("navigates to /profiles/:handle for user entity type", async () => {
    setupStore({
      notifications: [
        makeNotification({ type: "like", entityType: "user", actorHandle: "charlie", entityId: "user-3" }),
      ],
    });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /alice/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/profiles/charlie"));
  });

  it("shows unread indicator for unread notifications", () => {
    setupStore({
      notifications: [makeNotification({ type: "follow", entityType: "user", isRead: false })],
    });
    const { container } = render(<NotificationDropdown />);
    const dot = container.querySelector('[class*="ff5500"]');
    expect(dot).toBeInTheDocument();
  });

  it("does not show unread indicator for read notifications", () => {
    setupStore({
      notifications: [makeNotification({ type: "follow", entityType: "user", isRead: true })],
    });
    const { container } = render(<NotificationDropdown />);
    const dot = container.querySelector('[class*="ff5500"]');
    expect(dot).toBeNull();
  });

  it("renders avatar image when actorAvatarUrl is set", () => {
    setupStore({
      notifications: [makeNotification({ actorAvatarUrl: "https://example.com/x.jpg" })],
    });
    render(<NotificationDropdown />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/x.jpg");
  });

  it("renders fallback profile image when no actorAvatarUrl", () => {
    setupStore({ notifications: [makeNotification({ actorAvatarUrl: null })] });
    render(<NotificationDropdown />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/profile.png");
  });

  it("does not show the empty message when loading", () => {
    setupStore({ isLoading: true, notifications: [] });
    render(<NotificationDropdown />);
    expect(screen.queryByText(/no new notifications/i)).not.toBeInTheDocument();
  });

  it("does not show the empty message when there is an error", () => {
    setupStore({ error: "fail", notifications: [] });
    render(<NotificationDropdown />);
    expect(screen.queryByText(/no new notifications/i)).not.toBeInTheDocument();
  });

  it("calls markAsRead (only) when follow notification wrapper is clicked", async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    setupStore({
      notifications: [makeNotification({ type: "follow", entityType: "user" })],
      markAsRead,
    });

    render(<NotificationDropdown />);
    const wrapper = screen.getByTestId("user-card").closest("[class]") as HTMLElement;
    fireEvent.click(wrapper.parentElement!);
    await waitFor(() =>
      expect(markAsRead).toHaveBeenCalledWith(expect.objectContaining({ type: "follow" })),
    );
  });

  it("derives actor name from message when actorDisplayName is absent", () => {
    setupStore({
      notifications: [makeNotification({ actorDisplayName: undefined, message: "Dave liked your track" })],
    });
    render(<NotificationDropdown />);
    expect(screen.getByText("Dave")).toBeInTheDocument();
  });

  it("shows 'Someone' when no actorDisplayName and no parseable message", () => {
    setupStore({
      notifications: [makeNotification({ actorDisplayName: undefined, message: "" })],
    });
    render(<NotificationDropdown />);
    expect(screen.getByText("Someone")).toBeInTheDocument();
  });

  it("renders admin notification text without like wording", () => {
    setupStore({
      notifications: [
        makeNotification({
          type: "account_restored",
          actorDisplayName: undefined,
          message: "Your account has been restored",
          entityType: "user",
        }),
      ],
    });

    render(<NotificationDropdown />);
    expect(screen.getByText("Your account has been restored")).toBeInTheDocument();
    expect(screen.queryByText("liked your track")).not.toBeInTheDocument();
  });

  it("renders report outcome notification text without like wording", () => {
    setupStore({
      notifications: [
        makeNotification({
          type: "report_resolved",
          actorDisplayName: undefined,
          message: "Your report was reviewed. No violation was found.",
          entityType: "user",
        }),
      ],
    });

    render(<NotificationDropdown />);
    expect(screen.getByText("Your report was reviewed. No violation was found.")).toBeInTheDocument();
    expect(screen.queryByText("liked your track")).not.toBeInTheDocument();
  });
});
