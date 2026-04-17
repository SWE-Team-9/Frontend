import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TimestampedCommentsSection from "@/src/components/tracks/TimestampedCommentsSection";

const mockGetTrackComments = jest.fn();
const mockAddTrackComment = jest.fn();

let latestWaveformProps: MockWaveformDisplayProps | null = null;

jest.mock("@/src/services/interactionService", () => ({
  getTrackComments: (...args: unknown[]) => mockGetTrackComments(...args),
  addTrackComment: (...args: unknown[]) => mockAddTrackComment(...args),
}));

type MockWaveformDisplayProps = {
  onMarkerEnter?: (id: string) => void;
  onMarkerLeave?: () => void;
  onSeek?: (progress: number) => void;
  markers?: Array<{
    id: string;
    progress: number;
    label: string;
  }>;
};

jest.mock("@/src/components/tracks/WaveformDisplay", () => ({
  __esModule: true,
  WaveformDisplay: (props: MockWaveformDisplayProps) => {
    latestWaveformProps = props;
    return (
      <div data-testid="waveform-display">
        <button onClick={() => props.onMarkerEnter?.("c1")}>Hover marker</button>
        <button onClick={() => props.onMarkerLeave?.()}>Leave marker</button>
        <button onClick={() => props.onSeek?.(0.25)}>Seek</button>
      </div>
    );
  },
}));

describe("TimestampedCommentsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestWaveformProps = null;

    mockGetTrackComments.mockResolvedValue({
      page: 1,
      limit: 100,
      total: 1,
      comments: [
        {
          commentId: "c1",
          trackId: "trk_1",
          text: "Great drop",
          timestampSeconds: 30,
          createdAt: "2026-04-12T10:00:00Z",
          user: {
            id: "usr_1",
            display_name: "Maryam",
          },
        },
      ],
    });

    mockAddTrackComment.mockResolvedValue({
      commentId: "c2",
      trackId: "trk_1",
      text: "Nice",
      timestampSeconds: 45,
      createdAt: "2026-04-12T10:10:00Z",
    });
  });

  it("loads comments when opened by hover", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
      />
    );

    const root = screen.getByTestId("waveform-display").parentElement as HTMLDivElement;
    fireEvent.mouseEnter(root);

    await waitFor(() => {
      expect(mockGetTrackComments).toHaveBeenCalledWith("trk_1", 1, 100);
    });
  });

  it("passes mapped markers to waveform display", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
      />
    );

    const root = screen.getByTestId("waveform-display").parentElement as HTMLDivElement;
    fireEvent.mouseEnter(root);

    await waitFor(() => {
      expect(latestWaveformProps?.markers).toEqual([
        {
          id: "c1",
          progress: 0.25,
          label: "Maryam: Great drop",
        },
      ]);
    });
  });

  it("shows active comment tooltip when marker is entered", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
      />
    );

    const root = screen.getByTestId("waveform-display").parentElement as HTMLDivElement;
    fireEvent.mouseEnter(root);

    await waitFor(() => {
      expect(mockGetTrackComments).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText("Hover marker"));
    expect(screen.getByText(/maryam/i)).toBeInTheDocument();
    expect(screen.getByText(/great drop/i)).toBeInTheDocument();
  });

  it("sets snapshot timestamp on focus and submits comment on enter", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
      />
    );

    const input = screen.getByPlaceholderText(/write a comment/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Nice section" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockAddTrackComment).toHaveBeenCalledWith("trk_1", {
        content: "Nice section",
        timestampAt: 45,
      });
    });
  });

  it("submits comment when send button is clicked", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={50}
      />
    );

    const input = screen.getByPlaceholderText(/write a comment/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Amazing" } });

    fireEvent.click(screen.getByRole("button", { name: /send comment/i }));

    await waitFor(() => {
      expect(mockAddTrackComment).toHaveBeenCalledWith("trk_1", {
        content: "Amazing",
        timestampAt: 50,
      });
    });
  });

  it("does not load comments when disabled", async () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
        enabled={false}
      />
    );

    const root = screen.getByTestId("waveform-display").parentElement as HTMLDivElement;
    fireEvent.mouseEnter(root);

    await waitFor(() => {
      expect(mockGetTrackComments).not.toHaveBeenCalled();
    });
  });

  it("shows comment timestamp helper text", () => {
    render(
      <TimestampedCommentsSection
        trackId="trk_1"
        durationSeconds={120}
        currentPlaybackSeconds={45}
      />
    );

    const input = screen.getByPlaceholderText(/write a comment/i);
    fireEvent.focus(input);

    expect(screen.getByText(/comment will be added at/i)).toBeInTheDocument();
    expect(screen.getByText("0:45")).toBeInTheDocument();
  });
});