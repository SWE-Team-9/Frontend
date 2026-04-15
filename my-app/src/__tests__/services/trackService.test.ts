const mockApiGet = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

describe("trackService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";
  });

  it("getTrackDetails calls the backend endpoint", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
        coverArtUrl: "/cover.jpg",
        durationMs: 240000,
        genre: "Arabic Pop",
        likesCount: 10,
        liked: true,
        repostsCount: 2,
        reposted: false,
      },
    });

    const { getTrackDetails } = await import("@/src/services/trackService");
    const result = await getTrackDetails("trk_1");

    expect(mockApiGet).toHaveBeenCalledWith("/tracks/trk_1");
    expect(result.title).toBe("Layali");
    expect(result.artistId).toBe("usr_1");
  });
});