import "@testing-library/jest-dom";
import React from "react";
import { act, render } from "@testing-library/react";
import PlayerAudioSync from "@/src/components/player/PlayerAudioSync";

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
}));

const mockUsePlayerStore: jest.Mock = jest.fn();
const mockGetAudioElement: jest.Mock = jest.fn();
const mockGetState: jest.Mock = jest.fn();
const mockSetState: jest.Mock = jest.fn();

const mockAudio = {
  currentTime: 42,
  duration: 180,
  src: "",
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockStoreState = {
  currentTrack: { trackId: "trk_1", title: "Layali" },
  isPlaying: false,
  hydratedFromSession: false,
  hydratePlayerSession: jest.fn(),
  setCurrentTime: jest.fn(),
  setDuration: jest.fn(),
  persistProgress: jest.fn(),
  persistPlayerSession: jest.fn(),
  nextTrack: jest.fn(),
  fetchAndPlay: jest.fn(),
};

jest.useFakeTimers();

jest.mock("@/src/store/playerStore", () => {
  type MockedStoreHook = {
    (selector?: (state: unknown) => unknown): unknown;
    getState: (...args: unknown[]) => unknown;
    setState: (...args: unknown[]) => unknown;
  };

  const usePlayerStore = ((selector?: (state: unknown) => unknown) => {
    if (typeof selector === "function") {
      return mockUsePlayerStore(selector);
    }
    return mockUsePlayerStore();
  }) as MockedStoreHook;

  usePlayerStore.getState = (...args: unknown[]) => mockGetState(...args);
  usePlayerStore.setState = (...args: unknown[]) => mockSetState(...args);

  return {
    usePlayerStore,
    getAudioElement: () => mockGetAudioElement(),
  };
});

describe("PlayerAudioSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAudioElement.mockReturnValue(mockAudio);
    mockGetState.mockReturnValue(mockStoreState);

    mockUsePlayerStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      const state = {
        currentTrack: mockStoreState.currentTrack,
        isPlaying: mockStoreState.isPlaying,
        hydratedFromSession: mockStoreState.hydratedFromSession,
      };

      return typeof selector === "function" ? selector(state) : state;
    });
  });

  it("calls hydratePlayerSession on mount", () => {
    render(<PlayerAudioSync />);
    expect(mockStoreState.hydratePlayerSession).toHaveBeenCalledTimes(1);
  });

  it("registers audio event listeners", () => {
    render(<PlayerAudioSync />);
    expect(mockAudio.addEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith("play", expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith("pause", expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith("ended", expect.any(Function));
  });

  it("syncs current time on timeupdate", () => {
    render(<PlayerAudioSync />);
    const handler = (mockAudio.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "timeupdate"
    )?.[1];

    act(() => {
      handler();
    });

    expect(mockStoreState.setCurrentTime).toHaveBeenCalledWith(42);
  });

  it("syncs duration on loadedmetadata", () => {
    render(<PlayerAudioSync />);
    const handler = (mockAudio.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "loadedmetadata"
    )?.[1];

    act(() => {
      handler();
    });

    expect(mockStoreState.setDuration).toHaveBeenCalledWith(180);
  });

  it("sets isPlaying true on play event when store says false", () => {
    render(<PlayerAudioSync />);
    const handler = (mockAudio.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "play"
    )?.[1];

    act(() => {
      handler();
    });

    expect(mockSetState).toHaveBeenCalledWith({ isPlaying: true });
  });

  it("sets isPlaying false on pause event when store says true", () => {
    mockGetState.mockReturnValue({
      ...mockStoreState,
      isPlaying: true,
    });

    render(<PlayerAudioSync />);
    const handler = (mockAudio.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "pause"
    )?.[1];

    act(() => {
      handler();
    });

    expect(mockSetState).toHaveBeenCalledWith({ isPlaying: false });
  });

  it("persists and moves next on ended", async () => {
    render(<PlayerAudioSync />);
    const handler = (mockAudio.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === "ended"
    )?.[1];

    await act(async () => {
      await handler();
    });

    expect(mockStoreState.persistProgress).toHaveBeenCalled();
    expect(mockStoreState.persistPlayerSession).toHaveBeenCalled();
    expect(mockStoreState.nextTrack).toHaveBeenCalled();
  });

  it("starts interval persistence when playing", () => {
    mockUsePlayerStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      const state = {
        currentTrack: mockStoreState.currentTrack,
        isPlaying: true,
        hydratedFromSession: false,
      };

      return typeof selector === "function" ? selector(state) : state;
    });

    render(<PlayerAudioSync />);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(mockStoreState.persistProgress).toHaveBeenCalled();
  });

  it("calls fetchAndPlay when hydrated track exists and audio src is empty", () => {
    mockUsePlayerStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      const state = {
        currentTrack: mockStoreState.currentTrack,
        isPlaying: false,
        hydratedFromSession: true,
      };

      return typeof selector === "function" ? selector(state) : state;
    });

    mockAudio.src = "";

    render(<PlayerAudioSync />);
    expect(mockStoreState.fetchAndPlay).toHaveBeenCalledWith(mockStoreState.currentTrack);
  });
});