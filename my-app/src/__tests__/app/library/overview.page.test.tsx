import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import LibraryOverviewPage from "@/src/app/library/overview/page";

const mockGetRecentlyPlayed = jest.fn();

jest.mock("@/src/services/historyService", () => ({
  getRecentlyPlayed: (...args: unknown[]) => mockGetRecentlyPlayed(...args),
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

describe("LibraryOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state first", () => {
    mockGetRecentlyPlayed.mockReturnValue(new Promise(() => {}));

    render(<LibraryOverviewPage />);

    expect(screen.getByTestId("library-tabs")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders recently played row when tracks exist", async () => {
    mockGetRecentlyPlayed.mockResolvedValue([
      {
        trackId: "trk_1",
        title: "Layali",
        artist: "Ahmed Hassan",
        artistId: "usr_1",
        lastPlayedAt: "2026-04-12T10:00:00Z",
        lastPositionSeconds: 50,
      },
    ]);

    render(<LibraryOverviewPage />);

    expect(await screen.findByTestId("recently-played-row")).toBeInTheDocument();
    expect(screen.getByText("Recently played")).toBeInTheDocument();
    expect(screen.getByText("Layali")).toBeInTheDocument();
  });

  it("renders empty state when there are no tracks", async () => {
    mockGetRecentlyPlayed.mockResolvedValue([]);

    render(<LibraryOverviewPage />);

    expect(
      await screen.findByText(/start playing tracks and they’ll appear here/i)
    ).toBeInTheDocument();
  });
});