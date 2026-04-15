import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecentlyPlayedCard from "@/src/components/discover/RecentlyPlayedCard";

const mockToggle = jest.fn();
const mockFetchAndPlay = jest.fn();
const mockToggleLike = jest.fn();
const mockIsLiked = jest.fn();
const mockUsePlayerStore = jest.fn();
const mockUseLikeStore = jest.fn();

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

jest.mock("@/src/components/discover/TrackCardMenu", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onAddToNextUp,
    onAddToPlaylist,
  }: {
    isOpen: boolean;
    onAddToNextUp: () => void;
    onAddToPlaylist: () => void;
  }) =>
    isOpen ? (
      <div data-testid="track-card-menu">
        <button onClick={onAddToNextUp}>Add to Next Up</button>
        <button onClick={onAddToPlaylist}>Add to playlist</button>
      </div>
    ) : null,
}));

describe("RecentlyPlayedCard", () => {
  const track = {
    trackId: "trk_1",
    title: "Layali",
    artist: "Ahmed Hassan",
    artistId: "usr_1",
    artistHandle: "ahmed",
    artistAvatarUrl: null,
    coverArtUrl: "https://example.com/cover.jpg",
    liked: false,
    lastPlayedAt: "2026-04-12T10:00:00Z",
    lastPositionSeconds: 90,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayerStore.mockReturnValue({
    currentTrack: null,
    isPlaying: false,
    toggle: mockToggle,
    fetchAndPlay: mockFetchAndPlay,
    });

    mockIsLiked.mockReturnValue(false);

    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: [],
    });
  });

  it("renders track title", () => {
    render(<RecentlyPlayedCard track={track} />);

    expect(screen.getByText("Layali")).toBeInTheDocument();
  });

  it("calls fetchAndPlay when clicking play for a non-current track", () => {
    render(<RecentlyPlayedCard track={track} />);

    const playButton = screen.getAllByRole("button")[0];
    fireEvent.click(playButton);

    expect(mockFetchAndPlay).toHaveBeenCalledWith({
      trackId: "trk_1",
      title: "Layali",
      cover: "https://example.com/cover.jpg",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      artistHandle: "ahmed",
      artistAvatarUrl: null,
    });
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it("calls toggle when clicking play for the current track", () => {
    mockUsePlayerStore.mockReturnValue({
    currentTrack: { trackId: "trk_1" },
    isPlaying: true,
    toggle: mockToggle,
    fetchAndPlay: mockFetchAndPlay,
    });

    render(<RecentlyPlayedCard track={track} />);

    const playButton = screen.getAllByRole("button")[0];
    fireEvent.click(playButton);

    expect(mockToggle).toHaveBeenCalled();
    expect(mockFetchAndPlay).not.toHaveBeenCalled();
  });

  it("calls toggleLike when like button is clicked", async () => {
    render(<RecentlyPlayedCard track={track} />);

    const likeButton = screen.getByLabelText(/like track/i);
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockToggleLike).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "trk_1",
          title: "Layali",
          artistName: "Ahmed Hassan",
          repostsCount: 0,
          coverArtUrl: "https://example.com/cover.jpg",
        })
      );
    });
  });

  it("disables like button when like action is loading", () => {
    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: ["trk_1"],
    });

    render(<RecentlyPlayedCard track={track} />);

    const likeButton = screen.getByLabelText(/like track/i);
    expect(likeButton).toBeDisabled();
  });

  it("opens and closes the menu when menu button is clicked", () => {
    render(<RecentlyPlayedCard track={track} />);

    const menuButton = screen.getByLabelText(/open track menu/i);

    fireEvent.click(menuButton);
    expect(screen.getByTestId("track-card-menu")).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(screen.queryByTestId("track-card-menu")).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside", () => {
    render(
      <div>
        <button>Outside</button>
        <RecentlyPlayedCard track={track} />
      </div>
    );

    const menuButton = screen.getByLabelText(/open track menu/i);

    fireEvent.click(menuButton);
    expect(screen.getByTestId("track-card-menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(screen.queryByTestId("track-card-menu")).not.toBeInTheDocument();
  });
});