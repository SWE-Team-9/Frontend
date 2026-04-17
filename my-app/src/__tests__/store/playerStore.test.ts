const mockGetPlaybackState = jest.fn();
const mockGetPlaybackSource = jest.fn();
const mockGetPreviewSource = jest.fn();
const mockSavePlaybackProgress = jest.fn();
const mockMarkTrackPlayed = jest.fn();
const mockGetResumePosition = jest.fn();
const mockGetPlayerSession = jest.fn();
const mockUpdatePlayerSession = jest.fn();

jest.mock("@/src/services/playerService", () => ({
  getPlaybackState: (...args: unknown[]) => mockGetPlaybackState(...args),
  getPlaybackSource: (...args: unknown[]) => mockGetPlaybackSource(...args),
  getPreviewSource: (...args: unknown[]) => mockGetPreviewSource(...args),
  savePlaybackProgress: (...args: unknown[]) => mockSavePlaybackProgress(...args),
  markTrackPlayed: (...args: unknown[]) => mockMarkTrackPlayed(...args),
  getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
  getPlayerSession: (...args: unknown[]) => mockGetPlayerSession(...args),
  updatePlayerSession: (...args: unknown[]) => mockUpdatePlayerSession(...args),
}));

describe("playerStore", () => {
  const mockAudio = {
    preload: "",
    src: "",
    currentTime: 0,
    duration: 180,
    volume: 1,
    paused: true,
    error: null,
    play: jest.fn().mockImplementation(async () => {
      mockAudio.paused = false;
      return undefined;
    }),
    pause: jest.fn().mockImplementation(() => {
      mockAudio.paused = true;
    }),
    load: jest.fn(),
    removeAttribute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    class FakeAudio {
      preload = "";
      src = "";
      currentTime = 0;
      duration = 180;
      volume = 1;
      paused = true;
      error: MediaError | null = null;

      play = jest.fn().mockImplementation(async () => {
        this.paused = false;
        return undefined;
      });

      pause = jest.fn().mockImplementation(() => {
        this.paused = true;
      });

      load = jest.fn();
      removeAttribute = jest.fn();
    }

    global.Audio = FakeAudio as unknown as typeof Audio;
  });

  it("setTrack updates track state and resets playback flags", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");

    usePlayerStore.getState().setTrack({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      cover: "/cover.jpg",
    });

    const state = usePlayerStore.getState();
    expect(state.currentTrack?.trackId).toBe("trk_1");
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.isPlayerVisible).toBe(true);
    expect(state.hasRecordedPlay).toBe(false);
  });

  it("setTracks and setQueue store arrays", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");

    const tracks = [
      {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
    ];

    usePlayerStore.getState().setTracks(tracks);
    usePlayerStore.getState().setQueue(tracks);

    expect(usePlayerStore.getState().tracks).toEqual(tracks);
    expect(usePlayerStore.getState().queue).toEqual(tracks);
  });

  it("toggleShuffle flips shuffle state and persists session", async () => {
    mockUpdatePlayerSession.mockResolvedValue({
      message: "Player session updated successfully",
    });

    const { usePlayerStore } = await import("@/src/store/playerStore");

    expect(usePlayerStore.getState().isShuffleOn).toBe(false);

    usePlayerStore.getState().toggleShuffle();

    expect(usePlayerStore.getState().isShuffleOn).toBe(true);
    expect(mockUpdatePlayerSession).toHaveBeenCalled();
  });

  it("cycleLoopMode rotates OFF -> ALL -> ONE -> OFF", async () => {
    mockUpdatePlayerSession.mockResolvedValue({
      message: "Player session updated successfully",
    });

    const { usePlayerStore } = await import("@/src/store/playerStore");

    expect(usePlayerStore.getState().loopMode).toBe("OFF");

    usePlayerStore.getState().cycleLoopMode();
    expect(usePlayerStore.getState().loopMode).toBe("ALL");

    usePlayerStore.getState().cycleLoopMode();
    expect(usePlayerStore.getState().loopMode).toBe("ONE");

    usePlayerStore.getState().cycleLoopMode();
    expect(usePlayerStore.getState().loopMode).toBe("OFF");
  });

  it("loadResumePosition updates audio currentTime and store currentTime", async () => {
    mockGetResumePosition.mockResolvedValue({
      trackId: "trk_1",
      resumePositionSeconds: 77,
    });

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    const result = await usePlayerStore.getState().loadResumePosition("trk_1");

    expect(mockGetResumePosition).toHaveBeenCalledWith("trk_1");
    expect(result).toBe(77);
    expect(audio?.currentTime).toBe(77);
    expect(usePlayerStore.getState().currentTime).toBe(77);
  });

  it("recordPlayEvent only sends once", async () => {
    mockMarkTrackPlayed.mockResolvedValue({
      message: "Play event recorded successfully",
      trackId: "trk_1",
      playCount: 3,
    });

    const { usePlayerStore } = await import("@/src/store/playerStore");

    await usePlayerStore.getState().recordPlayEvent("trk_1");
    await usePlayerStore.getState().recordPlayEvent("trk_1");

    expect(mockMarkTrackPlayed).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().hasRecordedPlay).toBe(true);
  });

  it("persistProgress sends floored values and completion flag", async () => {
    mockSavePlaybackProgress.mockResolvedValue({
      message: "Playback progress saved successfully",
      trackId: "trk_1",
      positionSeconds: 178,
    });

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();
    if (audio) {
      Object.defineProperty(audio, "duration", {
        value: 180,
        configurable: true,
      });
    }

    usePlayerStore.setState({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
      currentTime: 178.9,
    });

    await usePlayerStore.getState().persistProgress();

    expect(mockSavePlaybackProgress).toHaveBeenCalledWith("trk_1", {
      positionSeconds: 178,
      durationSeconds: 180,
      isCompleted: true,
    });
  });

  it("persistPlayerSession sends normalized session payload", async () => {
    mockUpdatePlayerSession.mockResolvedValue({
      message: "Player session updated successfully",
    });

    const { usePlayerStore } = await import("@/src/store/playerStore");

    usePlayerStore.setState({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
      currentTime: 25.9,
      isPlaying: true,
      volume: 80,
      queue: [
        {
          trackId: "trk_2",
          title: "Next",
          artist: "Artist 2",
          artistId: "usr_2",
          cover: "/c2.jpg",
        },
      ],
      isShuffleOn: true,
      loopMode: "ALL",
    });

    await usePlayerStore.getState().persistPlayerSession();

    expect(mockUpdatePlayerSession).toHaveBeenCalledWith({
      currentTrackId: "trk_1",
      positionSeconds: 25,
      isPlaying: true,
      volume: 0.8,
      queueTrackIds: ["trk_2"],
      isShuffleOn: true,
      loopMode: "ALL",
    });
  });

  it("play starts audio, clears streamError, and records play", async () => {
    mockMarkTrackPlayed.mockResolvedValue({
      message: "Play event recorded successfully",
      trackId: "trk_1",
      playCount: 1,
    });

    mockUpdatePlayerSession.mockResolvedValue({
      message: "Player session updated successfully",
    });

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();
    if (audio) {
      audio.src = "/audio.mp3";
      audio.play = jest.fn().mockImplementation(async () => {
        (audio as typeof audio & { paused: boolean }).paused = false;
        return undefined;
      });
    }

    usePlayerStore.setState({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
      accessState: "PLAYABLE",
      streamError: "old error",
    });

    await usePlayerStore.getState().play();

    expect(audio?.play).toHaveBeenCalled();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().streamError).toBeNull();
    expect(mockMarkTrackPlayed).toHaveBeenCalledWith("trk_1");
  });

  it("play keeps success state when play promise rejects but audio already started", async () => {
    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    if (audio) {
      audio.src = "/audio.mp3";
      audio.play = jest.fn().mockImplementation(async () => {
        (audio as typeof audio & { paused: boolean; currentTime: number }).paused = false;
        (audio as typeof audio & { paused: boolean; currentTime: number }).currentTime = 1;
        throw new DOMException("The play() request was interrupted", "AbortError");
      });
    }

    usePlayerStore.setState({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
      accessState: "PLAYABLE",
      streamError: "old error",
    });

    await usePlayerStore.getState().play();

    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().streamError).toBeNull();
  });

  it("pause pauses audio and persists progress/session", async () => {
    mockSavePlaybackProgress.mockResolvedValue({});
    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    usePlayerStore.setState({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        cover: "/cover.jpg",
      },
      currentTime: 30,
      isPlaying: true,
    });

    await usePlayerStore.getState().pause();

    expect(audio?.pause).toHaveBeenCalled();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(mockSavePlaybackProgress).toHaveBeenCalled();
    expect(mockUpdatePlayerSession).toHaveBeenCalled();
  });

  it("nextTrack fetches the next track in order when shuffle is off", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 0,
      isShuffleOn: false,
      loopMode: "OFF",
    });

    await usePlayerStore.getState().nextTrack();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "t2" })
    );
  });

  it("nextTrack repeats current track when loop mode is ONE", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    const currentTrack = {
      trackId: "t1",
      title: "1",
      artist: "A",
      artistId: "u1",
      cover: "/1.jpg",
    };

    usePlayerStore.setState({
      tracks: [currentTrack],
      trackIndex: 0,
      currentTrack,
      loopMode: "ONE",
      isShuffleOn: false,
    });

    await usePlayerStore.getState().nextTrack();

    expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ trackId: "t1" }));
  });

  it("nextTrack stops playback at the last track when loop mode is OFF", async () => {
    mockSavePlaybackProgress.mockResolvedValue({});
    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 1,
      currentTrack: {
        trackId: "t2",
        title: "2",
        artist: "B",
        artistId: "u2",
        cover: "/2.jpg",
      },
      isPlaying: true,
      loopMode: "OFF",
      isShuffleOn: false,
    });

    await usePlayerStore.getState().nextTrack();

    expect(audio?.pause).toHaveBeenCalled();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("nextTrack wraps to first track when loop mode is ALL", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 1,
      loopMode: "ALL",
      isShuffleOn: false,
    });

    await usePlayerStore.getState().nextTrack();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "t1" })
    );
  });

  it("nextTrack picks a random different track when shuffle is on", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);

    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 0,
      isShuffleOn: true,
      loopMode: "OFF",
    });

    await usePlayerStore.getState().nextTrack();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "t2" })
    );

    randomSpy.mockRestore();
  });

  it("previousTrack resets to zero when currentTime is over 3 seconds", async () => {
    mockSavePlaybackProgress.mockResolvedValue({});
    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();
    if (audio) {
      audio.currentTime = 20;
    }

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
      ],
      trackIndex: 0,
      currentTime: 10,
    });

    await usePlayerStore.getState().previousTrack();

    expect(audio?.currentTime).toBe(0);
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("previousTrack fetches previous track when currentTime is 3 or less", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 1,
      currentTime: 2,
    });

    await usePlayerStore.getState().previousTrack();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "t1" })
    );
  });

  it("previousTrack wraps to last track when loop mode is ALL and current time is 3 or less", async () => {
    const { usePlayerStore } = await import("@/src/store/playerStore");
    const fetchSpy = jest.spyOn(usePlayerStore.getState(), "fetchAndPlay");

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "1", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "2", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
      trackIndex: 0,
      currentTime: 2,
      isShuffleOn: false,
      loopMode: "ALL",
    });

    await usePlayerStore.getState().previousTrack();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "t2" })
    );
  });

  it("setVolume stores 0-100 but writes audio volume as 0-1", async () => {
    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    await usePlayerStore.getState().setVolume(65);

    expect(usePlayerStore.getState().volume).toBe(65);
    expect(audio?.volume).toBe(0.65);
    expect(mockUpdatePlayerSession).toHaveBeenCalled();
  });

  it("seekTo updates audio and persists session/progress", async () => {
    mockUpdatePlayerSession.mockResolvedValue({});
    mockSavePlaybackProgress.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    await usePlayerStore.getState().seekTo(42);

    expect(audio?.currentTime).toBe(42);
    expect(usePlayerStore.getState().currentTime).toBe(42);
    expect(mockUpdatePlayerSession).toHaveBeenCalled();
  });

  it("hydratePlayerSession restores known current track and queue", async () => {
    mockGetPlayerSession.mockResolvedValue({
      currentTrack: { trackId: "t1", title: "One" },
      positionSeconds: 55,
      isPlaying: true,
      volume: 0.5,
      queue: [{ trackId: "t2", title: "Two" }],
      isShuffleOn: true,
      loopMode: "ONE",
    });

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    usePlayerStore.setState({
      tracks: [
        { trackId: "t1", title: "One", artist: "A", artistId: "u1", cover: "/1.jpg" },
        { trackId: "t2", title: "Two", artist: "B", artistId: "u2", cover: "/2.jpg" },
      ],
    });

    await usePlayerStore.getState().hydratePlayerSession();

    const state = usePlayerStore.getState();
    expect(state.currentTrack?.trackId).toBe("t1");
    expect(state.queue[0].trackId).toBe("t2");
    expect(state.currentTime).toBe(55);
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(50);
    expect(state.hydratedFromSession).toBe(true);
    expect(state.isShuffleOn).toBe(true);
    expect(state.loopMode).toBe("ONE");
    expect(audio?.volume).toBe(0.5);
  });

  it("fetchAndPlay handles playable track successfully", async () => {
    mockGetPlaybackState.mockResolvedValue({
      trackId: "trk_1",
      accessState: "PLAYABLE",
      reason: null,
    });

    mockGetPlaybackSource.mockResolvedValue({
      trackId: "trk_1",
      streamUrl: "/audio.mp3",
      accessState: "PLAYABLE",
    });

    mockMarkTrackPlayed.mockResolvedValue({});
    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();
    if (audio) {
      audio.play = jest.fn().mockImplementation(async () => {
        (audio as typeof audio & { paused: boolean }).paused = false;
        return undefined;
      });
    }

    usePlayerStore.setState({
      tracks: [
        {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          artistId: "usr_1",
          cover: "/cover.jpg",
        },
      ],
    });

    await usePlayerStore.getState().fetchAndPlay({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      cover: "/cover.jpg",
    });

    expect(mockGetPlaybackState).toHaveBeenCalledWith("trk_1");
    expect(mockGetPlaybackSource).toHaveBeenCalledWith("trk_1");
    expect(audio?.src).toContain("/audio.mp3");
    expect(usePlayerStore.getState().accessState).toBe("PLAYABLE");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("fetchAndPlay ignores aborted play error when audio already started", async () => {
    mockGetPlaybackState.mockResolvedValue({
      trackId: "trk_1",
      accessState: "PLAYABLE",
      reason: null,
    });

    mockGetPlaybackSource.mockResolvedValue({
      trackId: "trk_1",
      streamUrl: "/audio.mp3",
      accessState: "PLAYABLE",
    });

    const { usePlayerStore, getAudioElement } = await import("@/src/store/playerStore");
    const audio = getAudioElement();

    if (audio) {
      audio.play = jest.fn().mockImplementation(async () => {
        (audio as typeof audio & { paused: boolean; currentTime: number }).paused = false;
        (audio as typeof audio & { paused: boolean; currentTime: number }).currentTime = 1;
        throw new DOMException("The play() request was interrupted", "AbortError");
      });
    }

    usePlayerStore.setState({
      tracks: [
        {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          artistId: "usr_1",
          cover: "/cover.jpg",
        },
      ],
      streamError: "old error",
    });

    await usePlayerStore.getState().fetchAndPlay({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      cover: "/cover.jpg",
    });

    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().streamError).toBeNull();
    expect(usePlayerStore.getState().accessState).toBe("PLAYABLE");
  });

  it("fetchAndPlay handles blocked state without playback", async () => {
    mockGetPlaybackState.mockResolvedValue({
      trackId: "trk_1",
      accessState: "BLOCKED",
      reason: "Premium subscription required",
    });

    mockUpdatePlayerSession.mockResolvedValue({});

    const { usePlayerStore } = await import("@/src/store/playerStore");

    await usePlayerStore.getState().fetchAndPlay({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      cover: "/cover.jpg",
    });

    const state = usePlayerStore.getState();
    expect(state.accessState).toBe("BLOCKED");
    expect(state.accessReason).toBe("Premium subscription required");
    expect(state.isPlaying).toBe(false);
  });
});