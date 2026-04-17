import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import ListeningHistoryList from "@/src/components/library/ListeningHistoryList";

jest.mock("@/src/components/library/HistoryTrackRow", () => ({
  __esModule: true,
  default: ({ track }: { track: { title: string } }) => (
    <div data-testid="history-row">{track.title}</div>
  ),
}));

describe("ListeningHistoryList", () => {
  it("renders heading and rows", () => {
    render(
      <ListeningHistoryList
        tracks={[
          {
            trackId: "trk_1",
            title: "Layali",
            artist: "Ahmed Hassan",
            artistId: "usr_1",
            playedAt: "2026-04-12T10:00:00Z",
            positionSeconds: 10,
          },
          {
            trackId: "trk_2",
            title: "Neon Pulse",
            artist: "Synthwave Ghost",
            artistId: "usr_2",
            playedAt: "2026-04-12T11:00:00Z",
            positionSeconds: 20,
          },
        ]}
      />
    );

    expect(screen.getByText(/hear the tracks you've played/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("history-row")).toHaveLength(2);
    expect(screen.getByText("Layali")).toBeInTheDocument();
    expect(screen.getByText("Neon Pulse")).toBeInTheDocument();
  });
});