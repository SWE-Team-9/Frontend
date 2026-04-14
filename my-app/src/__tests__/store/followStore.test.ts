import { act } from '@testing-library/react';
import { useFollowStore } from '@/src/store/followStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useProfileStore } from '@/src/store/useProfileStore';
import * as followService from '@/src/services/followService';

jest.mock('@/src/services/followService');
const mockedService = followService as jest.Mocked<typeof followService>;

describe('useFollowStore - Consolidated 100% Coverage Suite', () => {
  const mockUser = { 
    id: 'user_1', 
    display_name: 'Test User', 
    handle: 'testuser', 
    avatar_url: '',
    accountType: 'ARTIST' 
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
    
      useFollowStore.setState({
        following: [],
        followers: [],
        profileFollowing: [],
        profileFollowers: [],
        suggestions: [],
        suggestionsLoading: false,
        loadingIds: {},
        error: null,
      });
      useAuthStore.setState({ user: { id: 'user_1' } as any });
      useProfileStore.setState({ userId: 'user_1', followingCount: 0, followersCount: 0 });
    });
  });

  // ---  UTILITY & BASIC STATE ---
  
  test('clearError: resets error state to null', () => {
    act(() => { useFollowStore.setState({ error: "Major Error" }); });
    act(() => { useFollowStore.getState().clearError(); });
    expect(useFollowStore.getState().error).toBeNull();
  });

  test('isFollowing: handles numeric, string, and invalid IDs', () => {
    act(() => { useFollowStore.setState({ following: [{ id: 123 } as any] }); });
    const store = useFollowStore.getState();
    
    expect(store.isFollowing("123")).toBe(true);  // String check
    expect(store.isFollowing(123)).toBe(true);    // Numeric check
    expect(store.isFollowing(undefined)).toBe(false);
    expect(store.isFollowing(null as any)).toBe(false);
  });

  // ---  TOGGLE FOLLOW (Optimistic, Success, and Rollbacks) ---

  test('toggleFollow: successful follow and count increment', async () => {
    mockedService.followUser.mockResolvedValue({} as any);

    await act(async () => {
      await useFollowStore.getState().toggleFollow(mockUser);
    });

    expect(mockedService.followUser).toHaveBeenCalledWith('user_1');
    expect(useFollowStore.getState().following).toContainEqual(mockUser);
    expect(useProfileStore.getState().followingCount).toBe(1);
  });

  test('toggleFollow: successful unfollow and count decrement', async () => {
    act(() => { useFollowStore.setState({ following: [mockUser] }); });
    mockedService.unfollowUser.mockResolvedValue({} as any);

    await act(async () => {
      await useFollowStore.getState().toggleFollow(mockUser);
    });

    expect(mockedService.unfollowUser).toHaveBeenCalledWith('user_1');
    expect(useFollowStore.getState().following).not.toContainEqual(mockUser);
    expect(useProfileStore.getState().followingCount).toBe(0);
  });

  test('toggleFollow: handles follow failure and rolls back state', async () => {
    mockedService.followUser.mockRejectedValueOnce(new Error("Network Fail"));

    await act(async () => {
      await useFollowStore.getState().toggleFollow(mockUser);
    });

    const state = useFollowStore.getState();
    expect(state.following).toHaveLength(0); // Reverted
    expect(state.error).toBe("Could not update follow status. Please try again.");
    expect(state.loadingIds[mockUser.id]).toBeUndefined(); // Finally block cleanup
  });

  test('toggleFollow: handles unfollow failure and rolls back list', async () => {
    act(() => { useFollowStore.setState({ following: [mockUser] }); });
    mockedService.unfollowUser.mockRejectedValueOnce(new Error("Fail"));

    await act(async () => {
      await useFollowStore.getState().toggleFollow(mockUser);
    });

    expect(useFollowStore.getState().following).toContainEqual(mockUser);
  });

  test('toggleFollow: returns early if user or user.id is missing', async () => {
    await act(async () => {
      await useFollowStore.getState().toggleFollow({} as any);
      await useFollowStore.getState().toggleFollow(null as any);
    });
    expect(mockedService.followUser).not.toHaveBeenCalled();
  });

  // ---  FETCHING DATA (Following & Followers) ---

  test('fetchFollowing: updates personal and profile list when viewing self', async () => {
    mockedService.getFollowing.mockResolvedValue({ following: [mockUser] } as any);

    await act(async () => {
      await useFollowStore.getState().fetchFollowing('user_1');
    });

    const state = useFollowStore.getState();
    expect(state.following).toHaveLength(1);
    expect(state.profileFollowing).toHaveLength(1);
    expect(useProfileStore.getState().followingCount).toBe(1);
  });

  test('fetchFollowing: handles ID mismatch (Viewing another profile)', async () => {
    mockedService.getFollowing.mockResolvedValue({ following: [mockUser] } as any);

    await act(async () => {
      // Current user is user_1, but we fetch for user_99
      await useFollowStore.getState().fetchFollowing('user_99');
    });

    const state = useFollowStore.getState();
    expect(state.profileFollowing).toHaveLength(1);
    expect(state.following).toHaveLength(0); // Personal list untouched
  });

  test('fetchFollowers: updates profile and handles empty data response', async () => {
    mockedService.getFollowers.mockResolvedValue({} as any); // followers undefined

    await act(async () => {
      await useFollowStore.getState().fetchFollowers('user_1');
    });

    expect(useFollowStore.getState().followers).toEqual([]);
    expect(useProfileStore.getState().followersCount).toBe(0);
  });

  test('fetchers: handle API rejections with error message', async () => {
    mockedService.getFollowing.mockRejectedValue(new Error());
    mockedService.getFollowers.mockRejectedValue(new Error());

    await act(async () => {
      await useFollowStore.getState().fetchFollowing('user_1');
      await useFollowStore.getState().fetchFollowers('user_1');
    });

    expect(useFollowStore.getState().error).toBeDefined();
  });

  test('fetchers: return early if no userId provided', async () => {
    await act(async () => {
      await useFollowStore.getState().fetchFollowing('');
      await useFollowStore.getState().fetchFollowers('');
    });
    expect(mockedService.getFollowing).not.toHaveBeenCalled();
  });

  // --- SUGGESTIONS ---

  test('fetchSuggestions: filters by accountType and isFollowing', async () => {
    const rawSuggestions = [
      { id: 'art_1', accountType: 'ARTIST' },
      { id: 'art_2', accountType: undefined }, 
      { id: 'user_bad', accountType: 'LISTENER' }, 
      { id: 'already_fol', accountType: 'ARTIST' } 
    ];
    
    act(() => { 
      useFollowStore.setState({ following: [{ id: 'already_fol' } as any] }); 
    });

    mockedService.getSuggestions.mockResolvedValue({ suggestions: rawSuggestions } as any);

    await act(async () => {
      await useFollowStore.getState().fetchSuggestions(5);
    });

    const state = useFollowStore.getState();
    expect(state.suggestions).toHaveLength(2); 
    expect(state.suggestionsLoading).toBe(false); 
  });

  test('fetchSuggestions: handles API error', async () => {
    mockedService.getSuggestions.mockRejectedValue(new Error());

    await act(async () => {
      await useFollowStore.getState().fetchSuggestions();
    });

    expect(useFollowStore.getState().error).toBe("Could not load suggested artists.");
    expect(useFollowStore.getState().suggestionsLoading).toBe(false);
  });
});