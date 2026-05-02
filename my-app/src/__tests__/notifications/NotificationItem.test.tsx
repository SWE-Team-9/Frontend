import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationItem } from "@/src/components/notifications/NotificationItem";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { Notification } from "@/src/types/notifications";
import { useRouter } from "next/navigation";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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

const BASE_DATE = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago

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

function setupStore(
  overrides: { markAsRead?: jest.Mock; removeNotification?: jest.Mock } = {},
) {
  const markAsRead =
    overrides.markAsRead ?? jest.fn().mockResolvedValue(undefined);
  const removeNotification =
    overrides.removeNotification ?? jest.fn().mockResolvedValue(undefined);

  mockedUseNotificationStore.mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({ markAsRead, removeNotification }),
  );

  return { markAsRead, removeNotification };
}

describe("NotificationItem — like/comment/repost notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
  });

  it("renders actor name and action text", () => {
    render(<NotificationItem notification={makeNotification()} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("liked your track")).toBeInTheDocument();
  });

  it("renders comment action text", () => {
    render(
      <NotificationItem notification={makeNotification({ type: "comment" })} />,
    );
    expect(screen.getByText("commented on your track")).toBeInTheDocument();
  });

  it("renders repost action text", () => {
    render(
      <NotificationItem notification={makeNotification({ type: "repost" })} />,
    );
    expect(screen.getByText("reposted your track")).toBeInTheDocument();
  });

  it("shows unread indicator dot when isRead is false", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ isRead: false })} />,
    );
    const dot = container.querySelector('[class*="ff5500"]');
    expect(dot).toBeInTheDocument();
  });

  it("hides unread dot when isRead is true", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ isRead: true })} />,
    );
    const dot = container.querySelector('[class*="ff5500"]');
    expect(dot).toBeNull();
  });

  it("applies opacity-70 class when isRead is true", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ isRead: true })} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("opacity-70");
  });

  it("shows relative time", () => {
    render(<NotificationItem notification={makeNotification()} />);
    expect(screen.getByText(/minutes? ago/i)).toBeInTheDocument();
  });

  it("calls markAsRead and router.push when the content area is clicked", async () => {
    const { markAsRead } = setupStore();
    render(
      <NotificationItem
        notification={makeNotification({
          entityType: "track",
          entityId: "track-99",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(markAsRead).toHaveBeenCalled());
  });

  it("calls removeNotification when Delete button is clicked", async () => {
    const { removeNotification } = setupStore();
    render(<NotificationItem notification={makeNotification()} />);
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);
    await waitFor(() =>
      expect(removeNotification).toHaveBeenCalledWith("notif-1"),
    );
  });

  it("does not bubble click to markAsRead when Delete is clicked", async () => {
    const { markAsRead, removeNotification } = setupStore();
    render(<NotificationItem notification={makeNotification()} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(removeNotification).toHaveBeenCalled());
    expect(markAsRead).not.toHaveBeenCalled();
  });

  it("renders actor avatar image when actorAvatarUrl is provided", () => {
    render(
      <NotificationItem
        notification={makeNotification({
          actorAvatarUrl: "https://example.com/avatar.jpg",
        })}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders fallback profile image when actorAvatarUrl is null", () => {
    render(
      <NotificationItem
        notification={makeNotification({ actorAvatarUrl: null })}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/profile.png");
  });

  it("derives actor name from message when actorDisplayName is absent", () => {
    const notif = makeNotification({
      actorDisplayName: undefined,
      message: "Bob liked your track",
    });
    render(<NotificationItem notification={notif} />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("falls back actor name to 'Someone' when message is empty and no displayName", () => {
    const notif = makeNotification({
      actorDisplayName: undefined,
      message: "",
    });
    render(<NotificationItem notification={notif} />);
    expect(screen.getByText("Someone")).toBeInTheDocument();
  });
});

describe("NotificationItem — follow notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
  });

  it("renders UserCard for follow type", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "follow", entityType: "user" })}
      />,
    );
    expect(screen.getByTestId("user-card")).toBeInTheDocument();
  });

  it("passes actor name to UserCard", () => {
    render(
      <NotificationItem
        notification={makeNotification({
          type: "follow",
          actorDisplayName: "Carol",
          entityType: "user",
        })}
      />,
    );
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("shows unread dot for unread follow notification", () => {
    const { container } = render(
      <NotificationItem
        notification={makeNotification({
          type: "follow",
          isRead: false,
          entityType: "user",
        })}
      />,
    );
    const dot = container.querySelector('[class*="ff5500"]');
    expect(dot).toBeInTheDocument();
  });

  it("shows Delete button for follow notification", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "follow", entityType: "user" })}
      />,
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls removeNotification on Delete click for follow notification", async () => {
    const { removeNotification } = setupStore();
    render(
      <NotificationItem
        notification={makeNotification({
          type: "follow",
          id: "follow-notif",
          entityType: "user",
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() =>
      expect(removeNotification).toHaveBeenCalledWith("follow-notif"),
    );
  });

  it("shows relative time icon for follow notification", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "follow", entityType: "user" })}
      />,
    );
    expect(screen.getByTestId("icon-person")).toBeInTheDocument();
  });
});

describe("getRelativeTime edge cases", () => {
  it("shows 'just now' for timestamps less than 1 minute ago", () => {
    const justNow = new Date(Date.now() - 30 * 1000).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: justNow })}
      />,
    );
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows singular 'minute' for exactly 1 minute ago", () => {
    const oneMinuteAgo = new Date(Date.now() - 61 * 1000).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: oneMinuteAgo })}
      />,
    );
    expect(screen.getByText("1 minute ago")).toBeInTheDocument();
  });

  it("shows hours for timestamps 1-23 hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: twoHoursAgo })}
      />,
    );
    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
  });

  it("shows singular 'hour' for 1 hour ago", () => {
    const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: oneHourAgo })}
      />,
    );
    expect(screen.getByText("1 hour ago")).toBeInTheDocument();
  });

  it("shows days for timestamps 1-6 days ago", () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: threeDaysAgo })}
      />,
    );
    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
  });

  it("shows singular 'day' for exactly 1 day ago", () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: oneDayAgo })}
      />,
    );
    expect(screen.getByText("1 day ago")).toBeInTheDocument();
  });

  it("shows locale date for timestamps 7+ days ago", () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    render(
      <NotificationItem
        notification={makeNotification({ createdAt: twoWeeksAgo })}
      />,
    );
    const date = new Date(twoWeeksAgo).toLocaleDateString();
    expect(screen.getByText(date)).toBeInTheDocument();
  });
});

describe("getNotificationTarget routing", () => {
  it("navigates to /tracks/:id for track entity", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    setupStore({ markAsRead: jest.fn().mockResolvedValue(undefined) });
    render(
      <NotificationItem
        notification={makeNotification({
          entityType: "track",
          entityId: "track-42",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/tracks/track-42"));
  });

  it("navigates to /profiles/:handle for user entity", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    setupStore({ markAsRead: jest.fn().mockResolvedValue(undefined) });
    render(
      <NotificationItem
        notification={makeNotification({
          entityType: "user",
          actorHandle: "bob",
          entityId: "user-1",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/profiles/bob"));
  });

  it("navigates to /library/playlists for playlist entity", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    setupStore({ markAsRead: jest.fn().mockResolvedValue(undefined) });
    render(
      <NotificationItem
        notification={makeNotification({
          entityType: "playlist",
          entityId: "pl-1",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/library/playlists"),
    );
  });

  it("navigates to /notifications for unknown entity type", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    setupStore({ markAsRead: jest.fn().mockResolvedValue(undefined) });
    render(
      <NotificationItem
        notification={makeNotification({
          entityType: "comment" as unknown as "track",
          entityId: "c-1",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/notifications"));
  });
});
