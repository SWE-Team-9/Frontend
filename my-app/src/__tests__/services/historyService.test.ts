const mockApiGet = jest.fn();
const mockApiDelete = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

describe("historyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("getRecentlyPlayed maps API into recent items", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 6,
        total: 1,
        tracks: [
          {
            trackId: "trk_1",
            title: "Layali",
            slug: "layali",
            artist: {
              id: "usr_1",
              display_name: "Ahmed Hassan",
              handle: "ahmed",
              avatar_url: null,
            },
            coverArtUrl: "/cover.jpg",
            liked: true,
            likesCount: 8,
            reposted: false,
            repostsCount: 2,
            durationSeconds: 180,
            waveformData: null,
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 90,
          },
        ],
      },
    });

    const { getRecentlyPlayed } = await import("@/src/services/historyService");
    const result = await getRecentlyPlayed(6, 1);

    expect(mockApiGet).toHaveBeenCalledWith("/player/history/recent?page=1&limit=6");

    expect(result).toEqual([
      {
        trackId: "trk_1",
        title: "Layali",
        slug: "layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
        coverArtUrl: "/cover.jpg",
        liked: true,
        likesCount: 8,
        reposted: false,
        repostsCount: 2,
        durationMs: undefined,
        durationSeconds: 180,
        waveformData: null,
        lastPlayedAt: "2026-04-12T10:00:00Z",
        lastPositionSeconds: 90,
      },
    ]);
  });

  it("getRecentlyPlayed returns all tracks from the API", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 6,
        total: 2,
        tracks: [
          {
            trackId: "trk_1",
            title: "Still Exists",
            slug: "still-exists",
            artist: {
              id: "usr_1",
              display_name: "Artist One",
              handle: "artistone",
              avatar_url: null,
            },
            coverArtUrl: "/cover.jpg",
            liked: true,
            likesCount: 8,
            reposted: false,
            repostsCount: 2,
            durationSeconds: 180,
            waveformData: null,
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 90,
          },
          {
            trackId: "trk_deleted",
            title: "Deleted Track",
            slug: "deleted-track",
            artist: {
              id: "usr_deleted",
              display_name: "Deleted Artist",
              handle: "deletedartist",
              avatar_url: null,
            },
            coverArtUrl: null,
            liked: false,
            likesCount: 0,
            reposted: false,
            repostsCount: 0,
            durationSeconds: 120,
            waveformData: null,
            lastPlayedAt: "2026-04-12T09:00:00Z",
            lastPositionSeconds: 30,
          },
        ],
      },
    });

    const { getRecentlyPlayed } = await import("@/src/services/historyService");
    const result = await getRecentlyPlayed();

    expect(result).toEqual([
      {
        trackId: "trk_1",
        title: "Still Exists",
        slug: "still-exists",
        artist: "Artist One",
        artistId: "usr_1",
        artistHandle: "artistone",
        artistAvatarUrl: null,
        coverArtUrl: "/cover.jpg",
        liked: true,
        likesCount: 8,
        reposted: false,
        repostsCount: 2,
        durationMs: undefined,
        durationSeconds: 180,
        waveformData: null,
        lastPlayedAt: "2026-04-12T10:00:00Z",
        lastPositionSeconds: 90,
      },
      {
        trackId: "trk_deleted",
        title: "Deleted Track",
        slug: "deleted-track",
        artist: "Deleted Artist",
        artistId: "usr_deleted",
        artistHandle: "deletedartist",
        artistAvatarUrl: null,
        coverArtUrl: null,
        liked: false,
        likesCount: 0,
        reposted: false,
        repostsCount: 0,
        durationMs: undefined,
        durationSeconds: 120,
        waveformData: null,
        lastPlayedAt: "2026-04-12T09:00:00Z",
        lastPositionSeconds: 30,
      },
    ]);
  });

  it("getListeningHistory maps API into history items", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 20,
        total: 1,
        history: [
          {
            trackId: "trk_2",
            title: "Neon Pulse",
            slug: "neon-pulse",
            artist: {
              id: "usr_2",
              display_name: "Synthwave Ghost",
              handle: "synth",
              avatar_url: "/artist.jpg",
            },
            coverArtUrl: "/cover2.jpg",
            liked: false,
            likesCount: 10,
            reposted: true,
            repostsCount: 4,
            durationSeconds: 180,
            waveformData: null,
            playedAt: "2026-04-12T11:00:00Z",
            positionSeconds: 40,
            isCompleted: false,
          },
        ],
      },
    });

    const { getListeningHistory } = await import("@/src/services/historyService");
    const result = await getListeningHistory(20, 1);

    expect(mockApiGet).toHaveBeenCalledWith("/player/history?page=1&limit=20");
    expect(result).toEqual([
      {
        trackId: "trk_2",
        title: "Neon Pulse",
        slug: "neon-pulse",
        artist: "Synthwave Ghost",
        artistId: "usr_2",
        artistHandle: "synth",
        artistAvatarUrl: "/artist.jpg",
        coverArtUrl: "/cover2.jpg",
        liked: false,
        likesCount: 10,
        reposted: true,
        repostsCount: 4,
        durationMs: undefined,
        durationSeconds: 180,
        waveformData: null,
        playedAt: "2026-04-12T11:00:00Z",
        positionSeconds: 40,
        isCompleted: false,
      },
    ]);
  });

  it("getListeningHistory returns all history items from the API", async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";

    mockApiGet.mockResolvedValue({
      data: {
        page: 1,
        limit: 20,
        total: 2,
        history: [
          {
            trackId: "trk_2",
            title: "Neon Pulse",
            slug: "neon-pulse",
            artist: {
              id: "usr_2",
              display_name: "Synthwave Ghost",
              handle: "synth",
              avatar_url: "/artist.jpg",
            },
            coverArtUrl: "/cover2.jpg",
            liked: false,
            likesCount: 10,
            reposted: true,
            repostsCount: 4,
            durationSeconds: 180,
            waveformData: null,
            playedAt: "2026-04-12T11:00:00Z",
            positionSeconds: 40,
            isCompleted: false,
          },
          {
            trackId: "trk_deleted",
            title: "Deleted Backend Title",
            slug: "deleted-backend-title",
            artist: {
              id: "usr_deleted",
              display_name: "Deleted Artist",
              handle: "deletedartist",
              avatar_url: null,
            },
            coverArtUrl: null,
            liked: false,
            likesCount: 0,
            reposted: false,
            repostsCount: 0,
            durationSeconds: 200,
            waveformData: null,
            playedAt: "2026-04-12T10:30:00Z",
            positionSeconds: 20,
            duratioSeconds: 200,
            isCompleted: true,
          },
        ],
      },
    });

    const { getListeningHistory } = await import("@/src/services/historyService");
    const result = await getListeningHistory();

    expect(result).toEqual([
      {
        trackId: "trk_2",
        title: "Neon Pulse",
        slug: "neon-pulse",
        artist: "Synthwave Ghost",
        artistId: "usr_2",
        artistHandle: "synth",
        artistAvatarUrl: "/artist.jpg",
        coverArtUrl: "/cover2.jpg",
        liked: false,
        likesCount: 10,
        reposted: true,
        repostsCount: 4,
        durationMs: undefined,
        durationSeconds: 180,
        waveformData: null,
        playedAt: "2026-04-12T11:00:00Z",
        positionSeconds: 40,
        isCompleted: false,
      },
      {
        trackId: "trk_deleted",
        title: "Deleted Backend Title",
        slug: "deleted-backend-title",
        artist: "Deleted Artist",
        artistId: "usr_deleted",
        artistHandle: "deletedartist",
        artistAvatarUrl: null,
        coverArtUrl: null,
        liked: false,
        likesCount: 0,
        reposted: false,
        repostsCount: 0,
        durationMs: undefined,
        durationSeconds: 200,
        waveformData: null,
        playedAt: "2026-04-12T10:30:00Z",
        positionSeconds: 20,
        isCompleted: true,
      },
    ]);
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