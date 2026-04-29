import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import RecentlyPlayedRow from "@/src/components/library/RecentlyPlayedRow";

jest.mock("@/src/components/discover/RecentlyPlayedCard", () => ({
  __esModule: true,
  default: ({ track }: { track: { title: string } }) => (
    <div data-testid="recent-card">{track.title}</div>
  ),
}));

describe("RecentlyPlayedRow", () => {
  it("renders default title and cards", () => {
    render(
      <RecentlyPlayedRow
        tracks={[
          {
            trackId: "trk_1",
            title: "Layali",
            artist: "Ahmed Hassan",
            artistId: "usr_1",
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 10,
          },
        ]}
      />
    );

    expect(screen.getByText("Recently played")).toBeInTheDocument();
    expect(screen.getByTestId("recent-card")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(
      <RecentlyPlayedRow
        title="Recently played:"
        tracks={[
          {
            trackId: "trk_1",
            title: "Layali",
            artist: "Ahmed Hassan",
            artistId: "usr_1",
            lastPlayedAt: "2026-04-12T10:00:00Z",
            lastPositionSeconds: 10,
          },
        ]}
      />
    );

    expect(screen.getByText("Recently played:")).toBeInTheDocument();
  });
});