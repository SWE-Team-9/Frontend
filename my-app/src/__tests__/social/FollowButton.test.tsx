import { render, screen, fireEvent, act } from "@testing-library/react";
import FollowButton from "@/src/components/profile/sidebar/FollowButton";
import { useFollowStore } from "@/src/store/followStore";
import * as followService from "@/src/services/followService";

jest.mock("@/src/services/followService");

describe("FollowButton Component", () => {
  const mockUser = { id: "user_1", display_name: "Test", handle: "test", avatar_url: "" };

  beforeEach(() => {
    act(() => {
    useFollowStore.setState({ 
      following: [], 
      loadingIds: {}, 
      error: null 
    });
  });
    jest.clearAllMocks();
  });

  test("renders 'Follow' for non-followed user and 'Following' for followed user", () => {
    const { rerender } = render(<FollowButton user={mockUser} />);
    expect(screen.getByRole("button")).toHaveTextContent("Follow");

    // Manually update store to simulate following
    act(() => {
    useFollowStore.setState({ following: [mockUser] });
    });
    rerender(<FollowButton user={mockUser} />);
    expect(screen.getByRole("button")).toHaveTextContent("Following");
  });

  test("prevents multiple clicks while loading", async () => {
    (followService.followUser as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<FollowButton user={mockUser} />);
    const button = screen.getByRole("button");
    
    fireEvent.click(button);
    
    // Should show loading dots and be disabled
    expect(button).toHaveTextContent("...");
    expect(button).toBeDisabled();
    
    // Second click should do nothing
    fireEvent.click(button);
    expect(followService.followUser).toHaveBeenCalledTimes(1);
  });

  test("clears previous errors when clicking button again", async () => {

   act(() => {
    useFollowStore.setState({ error: "Previous Error" });
  });
    render(<FollowButton user={mockUser} />);
    
    fireEvent.click(screen.getByRole("button"));
    
    // clearError() should have been called
    expect(screen.queryByText("Previous Error")).not.toBeInTheDocument();
  });
});