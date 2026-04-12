import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { VolumeControl } from "@/src/components/player/VolumeControl";

const mockUsePlayerStore = jest.fn();
const mockSetVolume = jest.fn();

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: () => mockUsePlayerStore(),
}));

describe("VolumeControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlayerStore.mockReturnValue({
      volume: 75,
      setVolume: mockSetVolume,
    });
  });

  it("renders mute button", () => {
    render(<VolumeControl />);
    expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  });

  it("mutes when current volume is above zero", () => {
    render(<VolumeControl />);
    fireEvent.click(screen.getByRole("button", { name: /mute/i }));
    expect(mockSetVolume).toHaveBeenCalledWith(0);
  });

  it("unmutes to previous volume when current volume is zero", () => {
    mockUsePlayerStore.mockReturnValue({
      volume: 0,
      setVolume: mockSetVolume,
    });

    render(<VolumeControl />);
    fireEvent.click(screen.getByRole("button", { name: /unmute/i }));
    expect(mockSetVolume).toHaveBeenCalledWith(75);
  });

  it("sets volume from slider click", () => {
    render(<VolumeControl />);

    const slider = screen.getByRole("button", { name: /mute/i }).parentElement
      ?.querySelector(".relative.w-1") as HTMLDivElement;

    jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      width: 10,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(slider, { clientY: 25 });
    expect(mockSetVolume).toHaveBeenCalledWith(75);
  });
});