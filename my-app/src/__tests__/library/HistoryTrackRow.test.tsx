import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HistoryTrackRow from "@/src/components/library/HistoryTrackRow";

const mockUsePlayerStore = jest.fn();
const mockUseLikeStore = jest.fn();
const mockUseRepostStore = jest.fn();
const mockToggle = jest.fn();
const mockFetchAndPlay = jest.fn();
const mockSeekTo = jest.fn();
const mockToggleLike = jest.fn();
const mockToggleRepost = jest.fn();
const mockIsLiked = jest.fn();
const mockIsReposted = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
}));

jest.mock("@/src/store/likeStore", () => ({
  useLikeStore: () => mockUseLikeStore(),
}));

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
      toggle: mockToggle,
      fetchAndPlay: mockFetchAndPlay,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
    });

    mockIsLiked.mockReturnValue(false);
    mockIsReposted.mockReturnValue(false);

    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: [],
    });

    mockUseRepostStore.mockReturnValue({
      toggleRepost: mockToggleRepost,
      isReposted: mockIsReposted,
      loadingIds: [],
    });
  });

  it("renders artist, title, and duration", () => {
    render(<HistoryTrackRow track={track} />);
    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
    expect(screen.getByText("Layali")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("calls fetchAndPlay for non-current track", () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getAllByRole("button")[0]);

    expect(mockFetchAndPlay).toHaveBeenCalledWith({
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      artistHandle: "ahmed",
      artistAvatarUrl: null,
      cover: "/cover.jpg",
    });
  });

  it("calls toggle for current track", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1" },
      isPlaying: true,
      toggle: mockToggle,
      fetchAndPlay: mockFetchAndPlay,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
    });

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getAllByRole("button")[0]);

    expect(mockToggle).toHaveBeenCalled();
    expect(mockFetchAndPlay).not.toHaveBeenCalled();
  });

  it("calls toggleLike with expected payload", async () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("10").closest("button") as HTMLButtonElement);

    await waitFor(() => {
      expect(mockToggleLike).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "trk_1",
          title: "Layali",
          artistName: "Ahmed Hassan",
          likesCount: 10,
        })
      );
    });
  });

  it("calls toggleRepost with expected payload", async () => {
    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("3").closest("button") as HTMLButtonElement);

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
      toggle: mockToggle,
      fetchAndPlay: mockFetchAndPlay,
      currentTime: 30,
      duration: 180,
      seekTo: mockSeekTo,
    });

    render(<HistoryTrackRow track={track} />);
    fireEvent.click(screen.getByText("Seek waveform"));

    await waitFor(() => {
      expect(mockSeekTo).toHaveBeenCalledWith(90);
    });
  });
});