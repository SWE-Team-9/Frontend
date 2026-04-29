import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlayerControls } from "@/src/components/player/PlayerControls";

const mockUsePlayerStore = jest.fn();
const mockToggle = jest.fn();
const mockNextTrack = jest.fn();
const mockPreviousTrack = jest.fn();
const mockToggleShuffle = jest.fn();
const mockCycleLoopMode = jest.fn();

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
}));

describe("PlayerControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlayerStore.mockReturnValue({
      currentTrack: {
        trackId: "trk_1",
        title: "Track 1",
      },
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
      isShuffleOn: false,
      loopMode: "OFF",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });
  });

  it("renders play button when not playing", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("calls toggleShuffle when shuffle button is clicked", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(mockToggleShuffle).toHaveBeenCalledTimes(1);
  });

  it("calls previousTrack when previous button is clicked", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    expect(mockPreviousTrack).toHaveBeenCalledTimes(1);
  });

  it("calls toggle when play button is clicked", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("calls nextTrack when next button is clicked", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[3]);
    expect(mockNextTrack).toHaveBeenCalledTimes(1);
  });

  it("calls cycleLoopMode when repeat button is clicked", () => {
    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[4]);
    expect(mockCycleLoopMode).toHaveBeenCalledTimes(1);
  });

  it("disables play button when track is blocked", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1", title: "Track 1" },
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: "BLOCKED",
      isProcessing: false,
      isResolvingPlayback: false,
      isShuffleOn: false,
      loopMode: "OFF",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });

    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[2]).toBeDisabled();
  });

  it("disables play button while processing", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1", title: "Track 1" },
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: null,
      isProcessing: true,
      isResolvingPlayback: false,
      isShuffleOn: false,
      loopMode: "OFF",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });

    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[2]).toBeDisabled();
  });

  it("disables previous and next when no current track", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
      isShuffleOn: false,
      loopMode: "OFF",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });

    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();
  });

  it("highlights shuffle button when shuffle is enabled", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1", title: "Track 1" },
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
      isShuffleOn: true,
      loopMode: "OFF",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });

    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveClass("text-[#f50]");
  });

  it("highlights repeat button when loop mode is not off", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTrack: { trackId: "trk_1", title: "Track 1" },
      isPlaying: false,
      toggle: mockToggle,
      nextTrack: mockNextTrack,
      previousTrack: mockPreviousTrack,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
      isShuffleOn: false,
      loopMode: "ALL",
      toggleShuffle: mockToggleShuffle,
      cycleLoopMode: mockCycleLoopMode,
    });

    render(<PlayerControls />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[4]).toHaveClass("text-[#f50]");
  });
});