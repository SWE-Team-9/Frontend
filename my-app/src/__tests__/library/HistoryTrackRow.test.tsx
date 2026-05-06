import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import HistoryTrackRow from "@/src/components/library/HistoryTrackRow";

const mockUsePlayerStore = jest.fn();
const mockUseLikeStore = jest.fn();
const mockUseRepostStore = jest.fn();
const mockPlayTrackFromContext = jest.fn();
const mockAddTrackToNextUp = jest.fn();
const mockSeekTo = jest.fn();
const mockToggleLike = jest.fn();
const mockToggleRepost = jest.fn();
const mockIsLiked = jest.fn();
const mockIsReposted = jest.fn();
const mockClearLikeError = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { fill: _fill, unoptimized: _unoptimized, ...rest } =
      props as React.ImgHTMLAttributes<HTMLImageElement> & {
        fill?: boolean;
        unoptimized?: boolean;
      };
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={rest.alt ?? ""} />;
  },
}));

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: (selector?: (state: unknown) => unknown) => {
    const state = mockUsePlayerStore();
    return typeof selector === "function" ? selector(state) : state;
  },
}));

jest.mock("@/src/store/likeStore", () => {
  const useLikeStore = () => mockUseLikeStore();
  useLikeStore.getState = () => mockUseLikeStore();
  return { useLikeStore };
});

jest.mock("@/src/store/repostStore", () => ({
  useRepostStore: () => mockUseRepostStore(),
}));

jest.mock("@/src/components/tracks/TimestampedCommentsSection", () => ({
  __esModule: true,
  default: ({
    onSeek,
  }: {
    onSeek?: (progress: number) => void;
  }) => (
    <div data-testid="timestamped-comments">
      <button onClick={() => onSeek?.(0.5)}>Seek waveform</button>
    </div>
  ),
}));

jest.mock("@/src/components/share/SharePopup", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-popup">
      <button onClick={onClose}>Close Share</button>
    </div>
  ),
}));

describe("HistoryTrackRow", () => {
  const track = {
    trackId: "trk_1",
    title: "Layali",
    artist: "Ahmed Hassan",
    artistId: "usr_1",
    artistHandle: "ahmed",
    artistAvatarUrl: null,
    coverArtUrl: "/cover.jpg",
    liked: false,
    likesCount: 10,
    reposted: false,
    repostsCount: 3,
    playedAt: "2026-04-12T10:00:00Z",
    positionSeconds: 30,
    durationSeconds: 180,
    isCompleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayerStore.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
      playTrackFromContext: mockPlayTrackFromContext,
      addTrackToNextUp: mockAddTrackToNextUp,
    });

    mockIsLiked.mockReturnValue(false);
    mockIsReposted.mockReturnValue(false);

    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: [],
      clearError: mockClearLikeError,
      error: null,
    });

    mockUseRepostStore.mockReturnValue({
      toggleRepost: mockToggleRepost,
      isReposted: mockIsReposted,
      loadingIds: [],
    });

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("renders artist, title, and duration", () => {
    render(<HistoryTrackRow track={track} />);
    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
    expect(screen.getByText("Layali")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("calls playTrackFromContext for track and context", () => {
    const contextTrackIds = ["trk_1", "trk_2"];
    render(<HistoryTrackRow track={track} contextTrackIds={contextTrackIds} />);
    fireEvent.click(screen.getAllByRole("button")[0]);

    expect(mockPlayTrackFromContext).toHaveBeenCalledWith(
      expect.objectContaining({
        track: expect.objectContaining({
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          artistId: "usr_1",
          artistHandle: "ahmed",
          artistAvatarUrl: null,
          cover: "/cover.jpg",
        }),
        contextTrackIds,
      })
    );
  });

  it("renders pause icon when current track is playing", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1" },
      isPlaying: true,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
      playTrackFromContext: mockPlayTrackFromContext,
      addTrackToNextUp: mockAddTrackToNextUp,
    });

    render(<HistoryTrackRow track={track} />);

    const playButton = screen.getAllByRole("button")[0];
    expect(playButton.querySelector("svg.ml-1")).toBeNull();
  });

  it("adjusts like and repost counts based on store state", () => {
    mockIsLiked.mockReturnValue(true);
    mockIsReposted.mockReturnValue(false);

    render(
      <HistoryTrackRow
        track={{
          ...track,
          liked: false,
          likesCount: 10,
          reposted: true,
          repostsCount: 3,
        }}
      />
    );

    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls toggleLike and shows error when store reports failure", async () => {
    jest.useFakeTimers();

    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: [],
      clearError: mockClearLikeError,
      error: "Like failed",
    });

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByTitle("Like"));

    await waitFor(() => {
      expect(mockToggleLike).toHaveBeenCalled();
      expect(mockClearLikeError).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Like failed")).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText("Like failed")).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("disables like button when like action is loading", () => {
    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: ["trk_1"],
      clearError: mockClearLikeError,
      error: null,
    });

    render(<HistoryTrackRow track={track} />);

    const likeButton = screen.getByTitle("Like");
    expect(likeButton).toBeDisabled();
  });

  it("calls toggleRepost with expected payload", async () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByTitle("Repost"));

    await waitFor(() => {
      expect(mockToggleRepost).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "trk_1",
          title: "Layali",
          artistName: "Ahmed Hassan",
          repostsCount: 3,
        })
      );
    });
  });

  it("seeks from waveform only when current track", async () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1" },
      isPlaying: true,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
      playTrackFromContext: mockPlayTrackFromContext,
      addTrackToNextUp: mockAddTrackToNextUp,
    });

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("Seek waveform"));

    await waitFor(() => {
      expect(mockSeekTo).toHaveBeenCalledWith(90);
    });
  });

  it("ignores waveform seek when not current track", () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("Seek waveform"));

    expect(mockSeekTo).not.toHaveBeenCalled();
  });

  it("opens and closes share popup", () => {
    render(<HistoryTrackRow track={track} />);

    fireEvent.click(screen.getByTitle("Share"));
    expect(screen.getByTestId("share-popup")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Share"));
    expect(screen.queryByTestId("share-popup")).not.toBeInTheDocument();
  });

  it("copies link and resets label on success", async () => {
    jest.useFakeTimers();

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("Copy link"));

    const writeText = navigator.clipboard.writeText as jest.Mock;
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("/tracks/trk_1")
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText("Copy link")).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("shows copy failure state when clipboard rejects", async () => {
    jest.useFakeTimers();

    const writeText = jest.fn().mockRejectedValue(new Error("nope"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("Copy link"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText("Copy link")).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("adds track to next up", () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByTitle("Add to Next Up"));

    expect(mockAddTrackToNextUp).toHaveBeenCalledWith("trk_1");
  });
});