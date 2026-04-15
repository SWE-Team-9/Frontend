import type { Mock } from "jest-mock";

const mockApiGet = jest.fn();
const mockApiDelete = jest.fn();
const mockGetTrackDetails = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

jest.mock("@/src/services/trackService", () => ({
  getTrackDetails: (...args: unknown[]) => mockGetTrackDetails(...args),
}));

describe("historyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("getRecentlyPlayed maps API + track details into enriched recent items", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 6,
        total: 1,
        tracks: [
          {
            trackId: "trk_1",
            title: "Fallback Title",
            artist: { id: "usr_1", display_name: "Fallback Artist" },
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 90,
          },
        ],
      },
    });

    mockGetTrackDetails.mockResolvedValue({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      artistHandle: "ahmed",
      artistAvatarUrl: null,
      coverArtUrl: "/cover.jpg",
      liked: true,
      likesCount: 8,
      reposted: false,
      repostsCount: 2,
    });

    const { getRecentlyPlayed } = await import("@/src/services/historyService");
    const result = await getRecentlyPlayed(6, 1);

    expect(mockApiGet).toHaveBeenCalledWith("/player/history/recent?page=1&limit=6");
    expect(mockGetTrackDetails).toHaveBeenCalledWith("trk_1");

    expect(result).toEqual([
      {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
        coverArtUrl: "/cover.jpg",
        liked: true,
        likesCount: 8,
        reposted: false,
        repostsCount: 2,
        lastPlayedAt: "2026-04-12T10:00:00Z",
        lastPositionSeconds: 90,
      },
    ]);
  });

  it("getRecentlyPlayed falls back to backend title and artist when details are missing", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 6,
        total: 1,
        tracks: [
          {
            trackId: "trk_1",
            title: "Fallback Title",
            artist: { id: "usr_1", display_name: "Fallback Artist" },
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 90,
          },
        ],
      },
    });

    mockGetTrackDetails.mockResolvedValue({
    trackId: "not_the_same_id",
    title: "Other",
    artist: "Other",
    artistId: "usr_other",
    artistHandle: undefined,
    artistAvatarUrl: null,
    coverArtUrl: null,
    liked: false,
    likesCount: 0,
    reposted: false,
    repostsCount: 0,
    });

    const { getRecentlyPlayed } = await import("@/src/services/historyService");
    const result = await getRecentlyPlayed();

    expect(result[0]).toEqual({
      trackId: "trk_1",
      title: "Fallback Title",
      artist: "Fallback Artist",
      artistId: "usr_1",
      artistHandle: undefined,
      artistAvatarUrl: null,
      coverArtUrl: null,
      liked: false,
      likesCount: 0,
      reposted: false,
      repostsCount: 0,
      lastPlayedAt: "2026-04-12T10:00:00Z",
      lastPositionSeconds: 90,
    });
  });

  it("getListeningHistory maps API + track details into enriched history items", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 20,
        total: 1,
        history: [
          {
            trackId: "trk_2",
            title: "Backend Title",
            playedAt: "2026-04-12T11:00:00Z",
            positionSeconds: 40,
            durationSeconds: 180,
            isCompleted: false,
          },
        ],
      },
    });

    mockGetTrackDetails.mockResolvedValue({
      trackId: "trk_2",
      title: "Neon Pulse",
      artist: "Synthwave Ghost",
      artistId: "usr_2",
      artistHandle: "synth",
      artistAvatarUrl: "/artist.jpg",
      coverArtUrl: "/cover2.jpg",
      liked: false,
      likesCount: 10,
      reposted: true,
      repostsCount: 4,
    });

    const { getListeningHistory } = await import("@/src/services/historyService");
    const result = await getListeningHistory(20, 1);

    expect(mockApiGet).toHaveBeenCalledWith("/player/history?page=1&limit=20");
    expect(result).toEqual([
      {
        trackId: "trk_2",
        title: "Neon Pulse",
        artist: "Synthwave Ghost",
        artistId: "usr_2",
        artistHandle: "synth",
        artistAvatarUrl: "/artist.jpg",
        coverArtUrl: "/cover2.jpg",
        liked: false,
        likesCount: 10,
        reposted: true,
        repostsCount: 4,
        playedAt: "2026-04-12T11:00:00Z",
        positionSeconds: 40,
        durationSeconds: 180,
        isCompleted: false,
      },
    ]);
  });

  it("getListeningHistory falls back to unknown artist defaults when details are missing", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 20,
        total: 1,
        history: [
          {
            trackId: "trk_2",
            title: "Backend Title",
            playedAt: "2026-04-12T11:00:00Z",
            positionSeconds: 40,
            durationSeconds: 180,
            isCompleted: true,
          },
        ],
      },
    });

    mockGetTrackDetails.mockResolvedValue({
    trackId: "not_the_same_id",
    title: "Other",
    artist: "Other",
    artistId: "usr_other",
    artistHandle: undefined,
    artistAvatarUrl: null,
    coverArtUrl: null,
    liked: false,
    likesCount: 0,
    reposted: false,
    repostsCount: 0,
    });

    const { getListeningHistory } = await import("@/src/services/historyService");
    const result = await getListeningHistory();

    expect(result[0]).toEqual({
      trackId: "trk_2",
      title: "Backend Title",
      artist: "Unknown Artist",
      artistId: "usr_unknown",
      artistHandle: undefined,
      artistAvatarUrl: null,
      coverArtUrl: null,
      liked: false,
      likesCount: 0,
      reposted: false,
      repostsCount: 0,
      playedAt: "2026-04-12T11:00:00Z",
      positionSeconds: 40,
      durationSeconds: 180,
      isCompleted: true,
    });
  });

  it("clearListeningHistory calls delete endpoint", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiDelete.mockResolvedValue({
      data: { message: "Listening history cleared successfully" },
    });

    const { clearListeningHistory } = await import("@/src/services/historyService");
    const result = await clearListeningHistory();

    expect(mockApiDelete).toHaveBeenCalledWith("/player/history");
    expect(result).toEqual({ message: "Listening history cleared successfully" });
  });
});