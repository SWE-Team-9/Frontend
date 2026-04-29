import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TrackInfo } from "@/src/components/player/TrackInfo";

const mockUsePlayerStore = jest.fn();
const mockUseLikeStore = jest.fn();
const mockToggleLike = jest.fn();
const mockIsLiked = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

jest.mock("@/src/store/playerStore", () => ({
  usePlayerStore: (selector: (state: unknown) => unknown) => mockUsePlayerStore(selector),
}));

jest.mock("@/src/store/likeStore", () => ({
  useLikeStore: () => mockUseLikeStore(),
}));

describe("TrackInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayerStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentTrack: {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          cover: "/cover.jpg",
        },
        accessState: null,
      })
    );

    mockIsLiked.mockReturnValue(false);

    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: [],
    });
  });

  it("renders nothing when no current track", () => {
    mockUsePlayerStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentTrack: null,
        accessState: null,
      })
    );

    const { container } = render(<TrackInfo />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title and artist", () => {
    render(<TrackInfo />);
    expect(screen.getByText("Layali")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
  });

  it("shows preview label in preview mode", () => {
    mockUsePlayerStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentTrack: {
          trackId: "trk_1",
          title: "Layali",
          artist: "Ahmed Hassan",
          cover: "/cover.jpg",
        },
        accessState: "PREVIEW",
      })
    );

    render(<TrackInfo />);
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
  });

  it("calls toggleLike when like button is clicked", async () => {
    render(<TrackInfo />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToggleLike).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "trk_1",
          title: "Layali",
          artistName: "Ahmed Hassan",
        })
      );
    });
  });

  it("disables like button while loading", () => {
    mockUseLikeStore.mockReturnValue({
      toggleLike: mockToggleLike,
      isLiked: mockIsLiked,
      loadingIds: ["trk_1"],
    });

    render(<TrackInfo />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});