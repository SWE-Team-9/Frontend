import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LibraryHistoryPage from "@/src/app/library/history/page";

const mockGetRecentlyPlayed = jest.fn();
const mockGetListeningHistory = jest.fn();
const mockClearListeningHistory = jest.fn();

jest.mock("@/src/services/historyService", () => ({
  getRecentlyPlayed: (...args: unknown[]) => mockGetRecentlyPlayed(...args),
  getListeningHistory: (...args: unknown[]) => mockGetListeningHistory(...args),
  clearListeningHistory: (...args: unknown[]) => mockClearListeningHistory(...args),
}));

jest.mock("@/src/components/library/LibraryTabs", () => ({
  __esModule: true,
  default: () => <div data-testid="library-tabs">LibraryTabs</div>,
}));

jest.mock("@/src/components/library/RecentlyPlayedRow", () => ({
  __esModule: true,
  default: ({
    title,
    tracks,
  }: {
    title: string;
    tracks: Array<{ title: string }>;
  }) => (
    <div data-testid="recently-played-row">
      <div>{title}</div>
      {tracks.map((track) => (
        <div key={track.title}>{track.title}</div>
      ))}
    </div>
  ),
}));

jest.mock("@/src/components/library/ListeningHistoryList", () => ({
  __esModule: true,
  default: ({ tracks }: { tracks: Array<{ title: string }> }) => (
    <div data-testid="listening-history-list">
      {tracks.map((track) => (
        <div key={track.title}>{track.title}</div>
      ))}
    </div>
  ),
}));

describe("LibraryHistoryPage", () => {
  const recentTracks = [
    {
      trackId: "trk_1",
      title: "Layali",
      artist: "Ahmed Hassan",
      artistId: "usr_1",
      lastPlayedAt: "2026-04-12T10:00:00Z",
      lastPositionSeconds: 40,
    },
    {
      trackId: "trk_2",
      title: "Neon Pulse",
      artist: "Synthwave Ghost",
      artistId: "usr_2",
      lastPlayedAt: "2026-04-12T11:00:00Z",
      lastPositionSeconds: 80,
    },
  ];

  const historyTracks = [
    {
      trackId: "trk_3",
      title: "Urban Echoes",
      artist: "City Pulse Collective",
      artistId: "usr_3",
      playedAt: "2026-04-12T12:00:00Z",
      positionSeconds: 100,
      durationSeconds: 200,
      isCompleted: false,
    },
    {
      trackId: "trk_4",
      title: "Digital Rain",
      artist: "Neon Frequencies",
      artistId: "usr_4",
      playedAt: "2026-04-12T13:00:00Z",
      positionSeconds: 200,
      durationSeconds: 200,
      isCompleted: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state first", () => {
    mockGetRecentlyPlayed.mockReturnValue(new Promise(() => {}));
    mockGetListeningHistory.mockReturnValue(new Promise(() => {}));

    render(<LibraryHistoryPage />);

    expect(screen.getByTestId("library-tabs")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders recent row and history list after loading", async () => {
    mockGetRecentlyPlayed.mockResolvedValue(recentTracks);
    mockGetListeningHistory.mockResolvedValue(historyTracks);

    render(<LibraryHistoryPage />);

    expect(await screen.findByTestId("recently-played-row")).toBeInTheDocument();
    expect(await screen.findByTestId("listening-history-list")).toBeInTheDocument();

    expect(screen.getByText("Recently played:")).toBeInTheDocument();
    expect(screen.getByText("Layali")).toBeInTheDocument();
    expect(screen.getByText("Urban Echoes")).toBeInTheDocument();
  });

  it("filters both recent and history tracks by input value", async () => {
    mockGetRecentlyPlayed.mockResolvedValue(recentTracks);
    mockGetListeningHistory.mockResolvedValue(historyTracks);

    render(<LibraryHistoryPage />);

    await screen.findByTestId("recently-played-row");

    const input = screen.getByPlaceholderText(/filter/i);
    fireEvent.change(input, { target: { value: "neon" } });

    expect(screen.getByText("Neon Pulse")).toBeInTheDocument();
    expect(screen.getByText("Digital Rain")).toBeInTheDocument();

    expect(screen.queryByText("Layali")).not.toBeInTheDocument();
    expect(screen.queryByText("Urban Echoes")).not.toBeInTheDocument();
  });

  it("shows empty message when both filtered lists become empty", async () => {
    mockGetRecentlyPlayed.mockResolvedValue(recentTracks);
    mockGetListeningHistory.mockResolvedValue(historyTracks);

    render(<LibraryHistoryPage />);

    await screen.findByTestId("recently-played-row");

    const input = screen.getByPlaceholderText(/filter/i);
    fireEvent.change(input, { target: { value: "zzzz-not-found" } });

    expect(screen.getByText(/no listening history found/i)).toBeInTheDocument();
    expect(screen.queryByTestId("recently-played-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("listening-history-list")).not.toBeInTheDocument();
  });

  it("clears all history when clear button is clicked", async () => {
    mockGetRecentlyPlayed.mockResolvedValue(recentTracks);
    mockGetListeningHistory.mockResolvedValue(historyTracks);
    mockClearListeningHistory.mockResolvedValue({ message: "ok" });

    render(<LibraryHistoryPage />);

    await screen.findByTestId("recently-played-row");

    const button = screen.getByRole("button", { name: /clear all history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockClearListeningHistory).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/no listening history found/i)).toBeInTheDocument();
  });

  it("disables clear button text while clearing", async () => {
    mockGetRecentlyPlayed.mockResolvedValue(recentTracks);
    mockGetListeningHistory.mockResolvedValue(historyTracks);

    let resolveClear: () => void = () => {};
    mockClearListeningHistory.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveClear = resolve;
      })
    );

    render(<LibraryHistoryPage />);

    await screen.findByTestId("recently-played-row");

    const button = screen.getByRole("button", { name: /clear all history/i });
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /clearing/i })).toBeDisabled();

    resolveClear();

    await waitFor(() => {
      expect(screen.getByText(/no listening history found/i)).toBeInTheDocument();
    });
  });
});