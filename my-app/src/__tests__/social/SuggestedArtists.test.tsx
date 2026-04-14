// src/__tests__/social/SuggestedArtists.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SuggestedArtists from "@/src/components/profile/sidebar/SuggestedArtists";
import { useFollowStore } from "@/src/store/followStore";

jest.mock("@/src/store/followStore");

describe("SuggestedArtists Component", () => {
  const mockFetch = jest.fn();
  const mockIsFollowing = jest.fn(() => false);

  beforeEach(() => {
    jest.clearAllMocks();
    (useFollowStore as unknown as jest.Mock).mockReturnValue({
      suggestions: [],
      suggestionsLoading: false,
      fetchSuggestions: mockFetch,
      isFollowing: mockIsFollowing,
      loadingIds: {},
      error: null,
    });
  });

  it("calls fetchSuggestions on mount", () => {
    render(<SuggestedArtists />);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("filters and renders only artist suggestions", () => {
    const mockUsers = [
      { id: "1", display_name: "Artist A", handle: "artist_a", accountType: "ARTIST", avatar_url: null },
      { id: "2", display_name: "User B", handle: "user_b", accountType: "LISTENER", avatar_url: null },
    ];
    
    (useFollowStore as unknown as jest.Mock).mockReturnValue({
      suggestions: mockUsers,
      suggestionsLoading: false,
      fetchSuggestions: mockFetch,
      isFollowing: mockIsFollowing,
      loadingIds: {},
      error: null,
    });

    render(<SuggestedArtists />);
    expect(screen.getByText("Artist A")).toBeInTheDocument();
    expect(screen.queryByText("User B")).not.toBeInTheDocument();
  });

  it("calls fetchSuggestions when refresh button is clicked", async () => {
    render(<SuggestedArtists />);
    const refreshBtn = screen.getByTitle(/Refresh suggestions/i);
    fireEvent.click(refreshBtn);
    
    // Using waitFor to handle any async state transitions
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});