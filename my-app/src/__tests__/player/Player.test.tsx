import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Player } from "@/src/components/player/Player";

const mockUsePlayerStore = jest.fn();
const mockUseAuthStore = jest.fn();
const mockUseFollowStore = jest.fn();
const mockGetAudioElement = jest.fn();
const mockToggleFollow = jest.fn();
const mockFetchFollowing = jest.fn();
const mockIsFollowing = jest.fn();

const mockAudio = {
  volume: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
  getAudioElement: () => mockGetAudioElement(),
}));

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

jest.mock("@/src/store/followStore", () => ({
  useFollowStore: () => mockUseFollowStore(),
}));

jest.mock("@/src/components/player/TrackInfo", () => ({
  TrackInfo: () => <div data-testid="track-info">TrackInfo</div>,
}));

jest.mock("@/src/components/player/PlayerControls", () => ({
  PlayerControls: () => <div data-testid="player-controls">PlayerControls</div>,
}));

jest.mock("@/src/components/player/ProgressBar", () => ({
  ProgressBar: () => <div data-testid="progress-bar">ProgressBar</div>,
}));

jest.mock("@/src/components/player/VolumeControl", () => ({
  VolumeControl: () => <div data-testid="volume-control">VolumeControl</div>,
}));

jest.mock("@/src/components/player/PlaybackToast", () => ({
  PlaybackToast: () => <div data-testid="playback-toast">PlaybackToast</div>,
}));

describe("Player", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAudioElement.mockReturnValue(mockAudio);

    mockUsePlayerStore.mockReturnValue({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_2",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
      },
      isPlayerVisible: true,
      volume: 75,
      isProcessing: false,
      isResolvingPlayback: false,
      accessState: null,
      accessReason: null,
      streamError: null,
    });

    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: "usr_1" },
      })
    );

    mockIsFollowing.mockReturnValue(false);

    mockUseFollowStore.mockReturnValue({
      toggleFollow: mockToggleFollow,
      isFollowing: mockIsFollowing,
      fetchFollowing: mockFetchFollowing,
      loadingIds: {},
    });
  });

  it("renders only toast when player is hidden", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: null,
      isPlayerVisible: false,
      volume: 75,
      isProcessing: false,
      isResolvingPlayback: false,
      accessState: null,
      accessReason: null,
      streamError: null,
    });

    render(<Player />);
    expect(screen.getByTestId("playback-toast")).toBeInTheDocument();
    expect(screen.queryByTestId("player-controls")).not.toBeInTheDocument();
  });

  it("renders player content when visible with current track", () => {
    render(<Player />);
    expect(screen.getByTestId("player-controls")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("volume-control")).toBeInTheDocument();
    expect(screen.getByTestId("track-info")).toBeInTheDocument();
  });

  it("sets audio volume from store volume", () => {
    render(<Player />);
    expect(mockAudio.volume).toBe(0.75);
  });

  it("fetches following for authenticated user", () => {
    render(<Player />);
    expect(mockFetchFollowing).toHaveBeenCalledWith("usr_1");
  });

  it("calls toggleFollow when follow button is clicked", async () => {
    render(<Player />);

    const buttons = screen.getAllByRole("button");
    const followButton = buttons.find((btn) => btn.getAttribute("title") === "Follow artist");

    expect(followButton).toBeTruthy();
    fireEvent.click(followButton as HTMLButtonElement);

    await waitFor(() => {
      expect(mockToggleFollow).toHaveBeenCalledWith({
        id: "usr_2",
        display_name: "Ahmed Hassan",
        handle: "ahmed",
        avatar_url: "",
      });
    });
  });

  it("disables follow button when user is the same as artist", () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: "usr_2" },
      })
    );

    render(<Player />);
    const buttons = screen.getAllByRole("button");
    const followButton = buttons.find(
      (btn) => btn.getAttribute("title") === "You cannot follow yourself"
    );

    expect(followButton).toBeDisabled();
  });

  it("shows loading track text while resolving playback", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_2",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
      },
      isPlayerVisible: true,
      volume: 75,
      isProcessing: false,
      isResolvingPlayback: true,
      accessState: null,
      accessReason: null,
      streamError: null,
    });

    render(<Player />);
    expect(screen.getByText(/loading track/i)).toBeInTheDocument();
    expect(screen.getByText(/connecting to server/i)).toBeInTheDocument();
  });

  it("shows blocked access message", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_2",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
      },
      isPlayerVisible: true,
      volume: 75,
      isProcessing: false,
      isResolvingPlayback: false,
      accessState: "BLOCKED",
      accessReason: "Unavailable here",
      streamError: null,
    });

    render(<Player />);
    expect(screen.getByText("Unavailable here")).toBeInTheDocument();
  });
});