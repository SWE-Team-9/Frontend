import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TrackCardMenu from "@/src/components/discover/TrackCardMenu";

describe("TrackCardMenu", () => {
  it("does not render when closed", () => {
    render(
      <TrackCardMenu
        isOpen={false}
        onAddToNextUp={jest.fn()}
        onAddToPlaylist={jest.fn()}
      />
    );

    expect(screen.queryByText(/add to next up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/add to playlist/i)).not.toBeInTheDocument();
  });

  it("renders both actions when open", () => {
    render(
      <TrackCardMenu
        isOpen
        onAddToNextUp={jest.fn()}
        onAddToPlaylist={jest.fn()}
      />
    );

    expect(screen.getByText(/add to next up/i)).toBeInTheDocument();
    expect(screen.getByText(/add to playlist/i)).toBeInTheDocument();
  });

  it("calls onAddToNextUp when first action is clicked", () => {
    const onAddToNextUp = jest.fn();

    render(
      <TrackCardMenu
        isOpen
        onAddToNextUp={onAddToNextUp}
        onAddToPlaylist={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText(/add to next up/i));
    expect(onAddToNextUp).toHaveBeenCalledTimes(1);
  });

  it("calls onAddToPlaylist when second action is clicked", () => {
    const onAddToPlaylist = jest.fn();

    render(
      <TrackCardMenu
        isOpen
        onAddToNextUp={jest.fn()}
        onAddToPlaylist={onAddToPlaylist}
      />
    );

    fireEvent.click(screen.getByText(/add to playlist/i));
    expect(onAddToPlaylist).toHaveBeenCalledTimes(1);
  });
});