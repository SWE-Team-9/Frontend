import { act } from '@testing-library/react';
import { useLikeStore } from '@/src/store/likeStore';
import * as likeService from '@/src/services/likeService';

jest.mock('@/src/services/likeService');
const mockedService = likeService as jest.Mocked<typeof likeService>;

describe('useLikeStore - 100% Coverage Suite', () => {
  const mockTrack = {
    id: 'track_1',
    title: 'Starboy',
    artistName: 'The Weeknd',
    likesCount: 10,
    repostsCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useLikeStore.setState({
        likedTracks: [],
        loadingIds: [],
        error: null,
      });
    });
  });

  test('toggleLike: adds track optimistically and calls service', async () => {
    mockedService.likeTrack.mockResolvedValue({} as any);

    await act(async () => {
      await useLikeStore.getState().toggleLike(mockTrack as any);
    });

    const state = useLikeStore.getState();
    expect(state.likedTracks).toHaveLength(1);
    expect(mockedService.likeTrack).toHaveBeenCalledWith('track_1');
  });

  test('toggleLike: removes track optimistically if already liked', async () => {
    act(() => { useLikeStore.setState({ likedTracks: [mockTrack as any] }); });
    mockedService.unlikeTrack.mockResolvedValue({} as any);

    await act(async () => {
      await useLikeStore.getState().toggleLike(mockTrack as any);
    });

    expect(useLikeStore.getState().likedTracks).toHaveLength(0);
    expect(mockedService.unlikeTrack).toHaveBeenCalledWith('track_1');
  });


  test('isLiked: correctly identifies numeric and string ID matches', () => {
    act(() => { useLikeStore.setState({ likedTracks: [{ id: 123 } as any] }); });
    const store = useLikeStore.getState();
    expect(store.isLiked("123")).toBe(true);
    expect(store.isLiked("999")).toBe(false);
  });

  test('toggleLike: prevents action if track is already in loadingIds', async () => {
    act(() => { useLikeStore.setState({ loadingIds: ['track_1'] }); });
    
    await act(async () => {
      await useLikeStore.getState().toggleLike(mockTrack as any);
    });

    expect(mockedService.likeTrack).not.toHaveBeenCalled();
  });

  test('toggleLike: handles alternate trackId property format', async () => {
    const altTrack = { trackId: 'alt_99', title: 'Alt' };
    mockedService.likeTrack.mockResolvedValue({} as any);

    await act(async () => {
      // @ts-ignore testing flexible ID format
      await useLikeStore.getState().toggleLike(altTrack);
    });

    expect(mockedService.likeTrack).toHaveBeenCalledWith('alt_99');
  });

  test('toggleLike: handles 409 Conflict gracefully (no rollback)', async () => {
    const conflictError = {
      response: { status: 409, data: { message: 'Already liked' } }
    };
    mockedService.likeTrack.mockRejectedValue(conflictError);

    await act(async () => {
      await useLikeStore.getState().toggleLike(mockTrack as any);
    });

    const state = useLikeStore.getState();
    // In a 409, we KEEP the optimistic state and don't set an error
    expect(state.likedTracks).toHaveLength(1);
    expect(state.error).toBeNull();
  });

  test('toggleLike: rolls back UNLIKE on failure', async () => {
    // Start as liked
    act(() => { useLikeStore.setState({ likedTracks: [mockTrack as any] }); });
    mockedService.unlikeTrack.mockRejectedValue(new Error("Fail"));

    await act(async () => {
      await useLikeStore.getState().toggleLike(mockTrack as any);
    });

    const state = useLikeStore.getState();
    // Should be back in the list
    expect(state.likedTracks).toHaveLength(1);
    expect(state.error).toBe("Fail");
  });

  test('syncWithServer: logs error on API failure', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    mockedService.getUserLikes.mockRejectedValue(new Error("Sync Error"));

    await act(async () => {
      await useLikeStore.getState().syncWithServer('user_1');
    });

    expect(spy).toHaveBeenCalledWith("Sync failed", expect.any(Error));
    spy.mockRestore();
  });

  test('clearError: removes the error string', () => {
    act(() => { useLikeStore.setState({ error: 'Some error' }); });
    act(() => { useLikeStore.getState().clearError(); });
    expect(useLikeStore.getState().error).toBeNull();
  });
});