import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RecentlyPlayedSection from "@/src/components/discover/RecentlyPlayedSection";

const mockGetRecentlyPlayed = jest.fn();
const mockSetTracks = jest.fn();
const mockUsePlayerStore = jest.fn();

jest.mock("@/src/services/historyService", () => ({
  getRecentlyPlayed: (...args: unknown[]) => mockGetRecentlyPlayed(...args),
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
    mockGetRecentlyPlayed.mockResolvedValue([]);

    render(<RecentlyPlayedSection />);

    expect(
      await screen.findByText(/start playing tracks and they’ll appear here/i)
    ).toBeInTheDocument();
  });

  it("loads tracks, renders cards, and updates player store", async () => {
    mockGetRecentlyPlayed.mockResolvedValue([
      {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        artistHandle: "ahmed",
        artistAvatarUrl: null,
        coverArtUrl: "https://example.com/1.jpg",
        durationSeconds: 180,
      },
      {
        trackId: "trk_2",
        title: "Neon Pulse",
        artist: "Synthwave Ghost",
        artistId: "usr_2",
        artistHandle: "synth",
        artistAvatarUrl: "https://example.com/avatar.jpg",
        coverArtUrl: null,
        durationSeconds: 200,
      },
    ]);

    render(<RecentlyPlayedSection />);

    expect(await screen.findByText("Layali")).toBeInTheDocument();
    expect(await screen.findByText("Neon Pulse")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockSetTracks).toHaveBeenCalledWith([
        {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          artistId: "usr_1",
          artistHandle: "ahmed",
          artistAvatarUrl: null,
          cover: "https://example.com/1.jpg",
          duration: 180,
        },
        {
          trackId: "trk_2",
          title: "Neon Pulse",
          artist: "Synthwave Ghost",
          artistId: "usr_2",
          artistHandle: "synth",
          artistAvatarUrl: "https://example.com/avatar.jpg",
          cover: "/images/track-placeholder.png",
          duration: 200,
        },
      ]);
    });
  });

  it("uses the API data for player tracks", async () => {
    mockGetRecentlyPlayed.mockResolvedValue([
      {
        trackId: "trk_1",
        title: "Fallback Title",
        artist: "Fallback Artist",
        artistId: "usr_1",
        artistHandle: undefined,
        artistAvatarUrl: null,
        coverArtUrl: null,
        durationSeconds: 210,
      },
    ]);

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
          duration: 210,
        },
      ]);
    });
  });
});