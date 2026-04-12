export {};
jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const getMockApi = () =>
  jest.requireMock("@/src/services/api").default as {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
  };

describe("playerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";
  });

  it("getPlaybackState calls the correct endpoint", async () => {
    getMockApi().get.mockResolvedValue({
      data: { trackId: "trk_1", accessState: "PLAYABLE", reason: null },
    });

    const { getPlaybackState } = await import("@/src/services/playerService");
    const result = await getPlaybackState("trk_1");

    expect(getMockApi().get).toHaveBeenCalledWith("/player/tracks/trk_1/state");
    expect(result).toEqual({ trackId: "trk_1", accessState: "PLAYABLE", reason: null });
  });

  it("getPlaybackSource calls the correct endpoint", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        trackId: "trk_1",
        streamUrl: "https://cdn.example.com/track.mp3",
        accessState: "PLAYABLE",
      },
    });

    const { getPlaybackSource } = await import("@/src/services/playerService");
    const result = await getPlaybackSource("trk_1");

    expect(getMockApi().get).toHaveBeenCalledWith("/player/tracks/trk_1/source");
    expect(result.streamUrl).toBe("https://cdn.example.com/track.mp3");
  });

  it("getPreviewSource calls the correct endpoint", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        trackId: "trk_1",
        previewUrl: "https://cdn.example.com/preview.mp3",
        previewDurationSeconds: 30,
        accessState: "PREVIEW",
      },
    });

    const { getPreviewSource } = await import("@/src/services/playerService");
    const result = await getPreviewSource("trk_1");

    expect(getMockApi().get).toHaveBeenCalledWith("/player/tracks/trk_1/preview");
    expect(result.previewUrl).toBe("https://cdn.example.com/preview.mp3");
  });

  it("getRecentlyPlayed returns backend payload as-is", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        page: 1,
        limit: 6,
        total: 1,
        tracks: [
          {
            trackId: "trk_1",
            title: "Layali",
            artist: { id: "usr_1", display_name: "Ahmed Hassan" },
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 50,
          },
        ],
      },
    });

    const { getRecentlyPlayed } = await import("@/src/services/playerService");
    const result = await getRecentlyPlayed(6, 1);

    expect(getMockApi().get).toHaveBeenCalledWith("/player/history/recent?page=1&limit=6");
    expect(result.total).toBe(1);
    expect(result.tracks[0].trackId).toBe("trk_1");
  });

  it("savePlaybackProgress posts progress body", async () => {
    getMockApi().post.mockResolvedValue({
      data: {
        message: "Playback progress saved successfully",
        trackId: "trk_1",
        positionSeconds: 97,
      },
    });

    const { savePlaybackProgress } = await import("@/src/services/playerService");
    const result = await savePlaybackProgress("trk_1", {
      positionSeconds: 97,
      durationSeconds: 240,
      isCompleted: false,
    });

    expect(getMockApi().post).toHaveBeenCalledWith("/player/tracks/trk_1/progress", {
      positionSeconds: 97,
      durationSeconds: 240,
      isCompleted: false,
    });
    expect(result.positionSeconds).toBe(97);
  });

  it("markTrackPlayed posts to play endpoint", async () => {
    getMockApi().post.mockResolvedValue({
      data: {
        message: "Play event recorded successfully",
        trackId: "trk_1",
        playCount: 42,
      },
    });

    const { markTrackPlayed } = await import("@/src/services/playerService");
    const result = await markTrackPlayed("trk_1");

    expect(getMockApi().post).toHaveBeenCalledWith("/player/tracks/trk_1/play");
    expect(result.playCount).toBe(42);
  });

  it("getResumePosition calls the correct endpoint", async () => {
    getMockApi().get.mockResolvedValue({
      data: { trackId: "trk_1", resumePositionSeconds: 77 },
    });

    const { getResumePosition } = await import("@/src/services/playerService");
    const result = await getResumePosition("trk_1");

    expect(getMockApi().get).toHaveBeenCalledWith("/player/tracks/trk_1/resume");
    expect(result.resumePositionSeconds).toBe(77);
  });

  it("getPlayerSession calls the correct endpoint", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        currentTrack: { trackId: "trk_1", title: "Layali" },
        positionSeconds: 44,
        isPlaying: false,
        volume: 0.75,
        queue: [],
      },
    });

    const { getPlayerSession } = await import("@/src/services/playerService");
    const result = await getPlayerSession();

    expect(getMockApi().get).toHaveBeenCalledWith("/player/session");
    expect(result.positionSeconds).toBe(44);
  });

  it("updatePlayerSession puts session payload", async () => {
    getMockApi().put.mockResolvedValue({
      data: { message: "Player session updated successfully" },
    });

    const { updatePlayerSession } = await import("@/src/services/playerService");
    const result = await updatePlayerSession({
      currentTrackId: "trk_1",
      positionSeconds: 25,
      isPlaying: true,
      volume: 0.8,
      queueTrackIds: ["trk_2", "trk_3"],
    });

    expect(getMockApi().put).toHaveBeenCalledWith("/player/session", {
      currentTrackId: "trk_1",
      positionSeconds: 25,
      isPlaying: true,
      volume: 0.8,
      queueTrackIds: ["trk_2", "trk_3"],
    });
    expect(result).toEqual({ message: "Player session updated successfully" });
  });
});