import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RecentlyPlayedSection from "@/src/components/discover/RecentlyPlayedSection";

const mockGetRecentlyPlayed = jest.fn();
const mockGetTrackDetails = jest.fn();
const mockSetTracks = jest.fn();
const mockUsePlayerStore = jest.fn();

jest.mock("@/src/services/playerService", () => ({
  getRecentlyPlayed: (...args: unknown[]) => mockGetRecentlyPlayed(...args),
}));

jest.mock("@/src/services/trackService", () => ({
  getTrackDetails: (...args: unknown[]) => mockGetTrackDetails(...args),
}));

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: (selector: (state: unknown) => unknown) => mockUsePlayerStore(selector),
}));

jest.mock("@/src/components/discover/RecentlyPlayedCard", () => ({
  __esModule: true,
  default: ({ track }: { track: { title: string } }) => (
    <div data-testid="recently-played-card">{track.title}</div>
  ),
}));

describe("RecentlyPlayedSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayerStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          setTracks: mockSetTracks,
        })
    );
  });

  it("renders loading state initially", () => {
    mockGetRecentlyPlayed.mockReturnValue(new Promise(() => {}));

    render(<RecentlyPlayedSection />);

    expect(screen.getByText("Recently Played")).toBeInTheDocument();
  });

  it("renders empty state when there are no tracks", async () => {
    mockGetRecentlyPlayed.mockResolvedValue({ tracks: [] });

    render(<RecentlyPlayedSection />);

    expect(
      await screen.findByText(/start playing tracks and they’ll appear here/i)
    ).toBeInTheDocument();
  });

  it("loads tracks, merges details, renders cards, and updates player store", async () => {
    mockGetRecentlyPlayed.mockResolvedValue({
      tracks: [
        {
          trackId: "trk_1",
          title: "Fallback Title",
          artist: {
            id: "usr_1",
            display_name: "Fallback Artist",
          },
          lastPlayedAt: "2026-04-12T10:00:00Z",
          lastPositionSeconds: 50,
        },
        {
          trackId: "trk_2",
          title: "Fallback Title 2",
          artist: {
            id: "usr_2",
            display_name: "Fallback Artist 2",
          },
          lastPlayedAt: "2026-04-12T11:00:00Z",
          lastPositionSeconds: 60,
        },
      ],
    });

    mockGetTrackDetails
      .mockResolvedValueOnce({
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
        coverArtUrl: "https://example.com/1.jpg",
        liked: true,
        likesCount: 10,
      })
      .mockResolvedValueOnce({
        trackId: "trk_2",
        title: "Neon Pulse",
        artist: "Synthwave Ghost",
        artistId: "usr_2",
        artistHandle: "synth",
        artistAvatarUrl: "https://example.com/avatar.jpg",
        coverArtUrl: null,
        liked: false,
        likesCount: 5,
      });

    render(<RecentlyPlayedSection />);

    expect(await screen.findByText("Layali")).toBeInTheDocument();
    expect(await screen.findByText("Neon Pulse")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetTrackDetails).toHaveBeenCalledTimes(2);
      expect(mockSetTracks).toHaveBeenCalledWith([
        {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          artistId: "usr_1",
          artistHandle: "ahmed",
          artistAvatarUrl: null,
          cover: "https://example.com/1.jpg",
        },
        {
          trackId: "trk_2",
          title: "Neon Pulse",
          artist: "Synthwave Ghost",
          artistId: "usr_2",
          artistHandle: "synth",
          artistAvatarUrl: "https://example.com/avatar.jpg",
          cover: "/images/track-placeholder.png",
        },
      ]);
    });
  });

  it("falls back to API item data when track details are missing", async () => {
    mockGetRecentlyPlayed.mockResolvedValue({
      tracks: [
        {
          trackId: "trk_1",
          title: "Fallback Title",
          artist: {
            id: "usr_1",
            display_name: "Fallback Artist",
          },
          lastPlayedAt: "2026-04-12T10:00:00Z",
          lastPositionSeconds: 50,
        },
      ],
    });

    mockGetTrackDetails.mockResolvedValue({
    trackId: "different_track_id",
    title: "Other Title",
    artist: "Other Artist",
    artistId: "other_artist",
    artistHandle: undefined,
    artistAvatarUrl: null,
    coverArtUrl: null,
    liked: false,
    likesCount: 0,
    });

    render(<RecentlyPlayedSection />);

    expect(await screen.findByText("Fallback Title")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockSetTracks).toHaveBeenCalledWith([
        {
          trackId: "trk_1",
          title: "Fallback Title",
          artist: "Fallback Artist",
          artistId: "usr_1",
          artistHandle: undefined,
          artistAvatarUrl: null,
          cover: "/images/track-placeholder.png",
        },
      ]);
    });
  });
});