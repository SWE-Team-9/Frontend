import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProgressBar } from "@/src/components/player/ProgressBar";

const mockUsePlayerStore = jest.fn();
const mockSeekTo = jest.fn();

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
}));

describe("ProgressBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlayerStore.mockReturnValue({
      currentTime: 30,
      duration: 120,
      seekTo: mockSeekTo,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
    });
  });

  it("renders formatted current time and duration", () => {
    render(<ProgressBar />);
    expect(screen.getByText("0:30")).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("calls seekTo with clicked position", () => {
    render(<ProgressBar />);
    const bar = screen.getByText("0:30").parentElement?.children[1] as HTMLDivElement;

    jest.spyOn(bar, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 10,
      top: 0,
      left: 0,
      bottom: 10,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(bar, { clientX: 100 });

    expect(mockSeekTo).toHaveBeenCalledWith(60);
  });

  it("does not seek when blocked", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTime: 30,
      duration: 120,
      seekTo: mockSeekTo,
      accessState: "BLOCKED",
      isProcessing: false,
      isResolvingPlayback: false,
    });

    render(<ProgressBar />);
    const bar = screen.getByText("0:30").parentElement?.children[1] as HTMLDivElement;
    fireEvent.click(bar, { clientX: 100 });

    expect(mockSeekTo).not.toHaveBeenCalled();
  });

  it("does not seek when duration is zero", () => {
    mockUsePlayerStore.mockReturnValue({
      currentTime: 0,
      duration: 0,
      seekTo: mockSeekTo,
      accessState: null,
      isProcessing: false,
      isResolvingPlayback: false,
    });

    render(<ProgressBar />);
    const times = screen.getAllByText("0:00");
    const bar = times[0].parentElement?.children[1] as HTMLDivElement;
    fireEvent.click(bar, { clientX: 100 });

    expect(mockSeekTo).not.toHaveBeenCalled();
  });
});