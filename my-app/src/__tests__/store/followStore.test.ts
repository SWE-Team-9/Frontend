import { useFollowStore } from "@/src/store/followStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useAuthStore } from "@/src/store/useAuthStore";

const mockFollowUser = jest.fn();
const mockUnfollowUser = jest.fn();
const mockGetFollowing = jest.fn();
const mockGetFollowers = jest.fn();
const mockGetSuggestions = jest.fn();

jest.mock("@/src/services/followService", () => ({
  followUser: (...args: unknown[]) => mockFollowUser(...args),
  unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
  getFollowing: (...args: unknown[]) => mockGetFollowing(...args),
  getFollowers: (...args: unknown[]) => mockGetFollowers(...args),
  getSuggestions: (...args: unknown[]) => mockGetSuggestions(...args),
}));

type FollowUserShape = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
};

const makeUser = (id: string, displayName?: string): FollowUserShape => ({
  id,
  display_name: displayName ?? id,
  handle: (displayName ?? id).toLowerCase().replace(/\s+/g, ""),
  avatar_url: "",
});

describe("followStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useFollowStore.setState({
      following: [],
      followers: [],
      profileFollowing: [],
      profileFollowers: [],
      suggestions: [],
      suggestionsLoading: false,
      loadingIds: {},
      error: null,
    });

    useProfileStore.getState().resetProfile();
    useAuthStore.setState({ user: null, isAuthenticated: false, email: null });
  });

  it("fetchFollowing with syncProfileList=false updates only self-following", async () => {
    useAuthStore.setState({
      user: {
        id: "me",
        email: "me@test.com",
        displayName: "Me",
      },
      isAuthenticated: true,
      email: "me@test.com",
    });

    useProfileStore.setState({ userId: "artist-1", followingCount: 9 });

    const previousProfileList = [makeUser("old-user")];
    useFollowStore.setState({ profileFollowing: previousProfileList });

    const selfFollowing = [makeUser("f-1", "Friend 1")];
    mockGetFollowing.mockResolvedValue({
      page: 1,
      limit: 20,
      total: 25,
      following: selfFollowing,
    });

    await useFollowStore
      .getState()
      .fetchFollowing("me", { syncProfileList: false });

    expect(useFollowStore.getState().following).toEqual(selfFollowing);
    expect(useFollowStore.getState().profileFollowing).toEqual(previousProfileList);
    expect(useProfileStore.getState().followingCount).toBe(9);
  });

  it("fetchFollowing syncs active profile list and count using server total", async () => {
    useProfileStore.setState({ userId: "artist-1", followingCount: 0 });

    const artistFollowing = [makeUser("u-1", "Artist Friend")];
    mockGetFollowing.mockResolvedValue({
      page: 1,
      limit: 20,
      total: 42,
      following: artistFollowing,
    });

    await useFollowStore
      .getState()
      .fetchFollowing("artist-1", { syncProfileList: true });

    expect(useFollowStore.getState().profileFollowing).toEqual(artistFollowing);
    expect(useProfileStore.getState().followingCount).toBe(42);
  });

  it("fetchFollowing ignores stale profile requests for a different active profile", async () => {
    useProfileStore.setState({ userId: "artist-2", followingCount: 7 });

    const currentProfileList = [makeUser("keep-me")];
    useFollowStore.setState({ profileFollowing: currentProfileList });

    mockGetFollowing.mockResolvedValue({
      page: 1,
      limit: 20,
      total: 99,
      following: [makeUser("wrong-user")],
    });

    await useFollowStore
      .getState()
      .fetchFollowing("artist-1", { syncProfileList: true });

    expect(useFollowStore.getState().profileFollowing).toEqual(currentProfileList);
    expect(useProfileStore.getState().followingCount).toBe(7);
  });

  it("toggleFollow updates active profile followersCount when following profile owner", async () => {
    useAuthStore.setState({
      user: {
        id: "me",
        email: "me@test.com",
        displayName: "Me",
      },
      isAuthenticated: true,
      email: "me@test.com",
    });

    useProfileStore.setState({
      userId: "artist-1",
      followersCount: 10,
      followingCount: 3,
    });

    mockFollowUser.mockResolvedValue({
      message: "User followed successfully",
      targetUserId: "artist-1",
      isFollowing: true,
    });

    await useFollowStore.getState().toggleFollow(makeUser("artist-1", "Artist"));

    expect(mockFollowUser).toHaveBeenCalledWith("artist-1");
    expect(useProfileStore.getState().followersCount).toBe(11);
    expect(useProfileStore.getState().followingCount).toBe(3);
  });

  it("toggleFollow updates own followingCount when active profile is current user", async () => {
    useAuthStore.setState({
      user: {
        id: "me",
        email: "me@test.com",
        displayName: "Me",
      },
      isAuthenticated: true,
      email: "me@test.com",
    });

    useProfileStore.setState({
      userId: "me",
      followersCount: 2,
      followingCount: 4,
    });

    mockFollowUser.mockResolvedValue({
      message: "User followed successfully",
      targetUserId: "artist-2",
      isFollowing: true,
    });

    await useFollowStore.getState().toggleFollow(makeUser("artist-2", "Artist 2"));

    expect(mockFollowUser).toHaveBeenCalledWith("artist-2");
    expect(useProfileStore.getState().followingCount).toBe(5);
    expect(useProfileStore.getState().followersCount).toBe(2);
  });
});
