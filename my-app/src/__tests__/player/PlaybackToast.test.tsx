import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PlaybackToast } from "@/src/components/player/PlaybackToast";

const mockUsePlayerStore = jest.fn();

jest.useFakeTimers();

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
}));

describe("PlaybackToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlayerStore.mockReturnValue({
      accessState: null,
      accessReason: null,
      streamError: null,
      isProcessing: false,
    });
  });

  it("renders nothing when there is no toast state", () => {
    const { container } = render(<PlaybackToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders blocked toast", () => {
    mockUsePlayerStore.mockReturnValue({
      accessState: "BLOCKED",
      accessReason: "Premium subscription required",
      streamError: null,
      isProcessing: false,
    });

    render(<PlaybackToast />);
    expect(screen.getByText("Premium subscription required")).toBeInTheDocument();
    expect(screen.getByText(/learn more/i)).toBeInTheDocument();
  });

  it("renders stream error toast", () => {
    mockUsePlayerStore.mockReturnValue({
      accessState: null,
      accessReason: null,
      streamError: "Playback failed",
      isProcessing: false,
    });

    render(<PlaybackToast />);
    expect(screen.getByText("Playback failed")).toBeInTheDocument();
    expect(screen.getByText(/try again later/i)).toBeInTheDocument();
  });

  it("renders processing toast", () => {
    mockUsePlayerStore.mockReturnValue({
      accessState: null,
      accessReason: null,
      streamError: null,
      isProcessing: true,
    });

    render(<PlaybackToast />);
    expect(screen.getByText(/still processing/i)).toBeInTheDocument();
  });

  it("dismisses when dismiss button is clicked", () => {
    mockUsePlayerStore.mockReturnValue({
      accessState: null,
      accessReason: null,
      streamError: "Playback failed",
      isProcessing: false,
    });

    render(<PlaybackToast />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Playback failed")).not.toBeInTheDocument();
  });

  it("auto hides after timeout", () => {
    mockUsePlayerStore.mockReturnValue({
      accessState: null,
      accessReason: null,
      streamError: "Playback failed",
      isProcessing: false,
    });

    render(<PlaybackToast />);
    expect(screen.getByText("Playback failed")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Playback failed")).not.toBeInTheDocument();
  });
});