import { useRepostStore } from '@/src/store/repostStore';
import * as repostService from '@/src/services/repostService';
import { TrackData } from '@/src/types/interactions';

jest.mock('@/src/services/repostService');
const mockedService = repostService as jest.Mocked<typeof repostService>;

describe('useRepostStore', () => {
  const mockTrack: TrackData = {
    id: 'track-1',
    title: 'Test Track',
    artistName: 'Test Artist',
    repostsCount: 5,
    coverArtUrl: '/test.png',
    likesCount: 10,
  };

  beforeEach(() => {
    
    useRepostStore.setState({
      repostedTracks: [],
      loadingIds: [],
      error: null,
    });
    jest.clearAllMocks();
  });
  // --- TEST FOR clearError ---
  test('clearError: sets error back to null', () => {
    useRepostStore.setState({ error: 'Some error' });
    useRepostStore.getState().clearError();
    expect(useRepostStore.getState().error).toBeNull();
  });
  // --- TEST FOR LOADING GUARD ---
  test('toggleRepost: prevents action if track is already loading', async () => {
    useRepostStore.setState({ loadingIds: ['track-1'] });
    
    await useRepostStore.getState().toggleRepost(mockTrack);

    // If the guard works, the API should NEVER have been called
    expect(mockedService.repostTrack).not.toHaveBeenCalled();
  });

  // --- TEST FOR syncWithServer ERROR BRANCH ---
  test('syncWithServer: logs error on failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedService.getUserReposts.mockRejectedValue(new Error('Sync Failed'));

    await useRepostStore.getState().syncWithServer('user-1');

    expect(consoleSpy).toHaveBeenCalledWith("Failed to sync reposts", expect.any(Error));
    consoleSpy.mockRestore();
  });

  // --- TEST FOR deleteRepostAction GUARD & ERROR ---
  test('deleteRepostAction: returns early if trackId is invalid', async () => {
    // @ts-ignore - testing runtime guard
    await useRepostStore.getState().deleteRepostAction(undefined);
    expect(mockedService.removeRepost).not.toHaveBeenCalled();
  });

  test('deleteRepostAction: logs error on API failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedService.removeRepost.mockRejectedValue(new Error('Delete Fail'));

    await useRepostStore.getState().deleteRepostAction('track-1');

    expect(consoleSpy).toHaveBeenCalledWith("Delete failed, rolling back", expect.any(Error));

    expect(useRepostStore.getState().loadingIds).not.toContain('track-1');
    consoleSpy.mockRestore();
  });

  // --- TEST FOR ALTERNATE TRACK OBJECT FORMAT ---
  test('toggleRepost: handles track objects with trackId property', async () => {
    const altTrack = { trackId: 'alt-99', repostsCount: 0 };
    mockedService.repostTrack.mockResolvedValue({ repostsCount: 1 } as any);

    // @ts-ignore - testing the flexible ID logic in the store
    await useRepostStore.getState().toggleRepost(altTrack);

    expect(mockedService.repostTrack).toHaveBeenCalledWith('alt-99');
  });

  
  test('toggleRepost: does not update repostsCount if response is invalid', async () => {
    
    mockedService.repostTrack.mockResolvedValue({} as any);

    await useRepostStore.getState().toggleRepost(mockTrack);

    const state = useRepostStore.getState();
    
    expect(state.repostedTracks[0].repostsCount).toBe(6);
  });

  test('toggleRepost: adds a track optimistically and updates on success', async () => {
    mockedService.repostTrack.mockResolvedValue({
      message: 'Success',
      trackId: 'track-1',
      repostsCount: 6,
      reposted: true
    });

    await useRepostStore.getState().toggleRepost(mockTrack);

    const state = useRepostStore.getState();
    expect(state.repostedTracks).toHaveLength(1);
    expect(state.repostedTracks[0].id).toBe('track-1');
    expect(state.repostedTracks[0].repostsCount).toBe(6); 
    expect(mockedService.repostTrack).toHaveBeenCalledWith('track-1');
  });

  test('toggleRepost: removes a track optimistically if already reposted', async () => {
    //  track already in the store
    useRepostStore.setState({ repostedTracks: [mockTrack] });

    mockedService.removeRepost.mockResolvedValue({
      message: 'Removed',
      trackId: 'track-1',
      repostsCount: 4,
      reposted: false
    });

    await useRepostStore.getState().toggleRepost(mockTrack);

    const state = useRepostStore.getState();
    expect(state.repostedTracks).toHaveLength(0);
    expect(mockedService.removeRepost).toHaveBeenCalledWith('track-1');
  });

  test('toggleRepost: rolls back state if API call fails', async () => {
    
    mockedService.repostTrack.mockRejectedValue(new Error('Network Error'));

    await useRepostStore.getState().toggleRepost(mockTrack);

    const state = useRepostStore.getState();
    
    expect(state.repostedTracks).toHaveLength(0);
    expect(state.error).toBe('Network Error');
  });

  test('syncWithServer: fetches and sets tracks', async () => {
    const mockList = [mockTrack];
    mockedService.getUserReposts.mockResolvedValue(mockList);

    await useRepostStore.getState().syncWithServer('user-123');

    const state = useRepostStore.getState();
    expect(state.repostedTracks).toEqual(mockList);
    expect(mockedService.getUserReposts).toHaveBeenCalledWith('user-123');
  });

  test('isReposted: correctly identifies tracks in the store', () => {
    useRepostStore.setState({ repostedTracks: [mockTrack] });
    
    expect(useRepostStore.getState().isReposted('track-1')).toBe(true);
    expect(useRepostStore.getState().isReposted('wrong-id')).toBe(false);
  });
  test('deleteRepostAction: removes track and calls API', async () => {
    useRepostStore.setState({ repostedTracks: [mockTrack] });
    mockedService.removeRepost.mockResolvedValue({} as any);

    
    await useRepostStore.getState().deleteRepostAction('track-1');


    const state = useRepostStore.getState();
    expect(state.repostedTracks).toHaveLength(0);
    expect(mockedService.removeRepost).toHaveBeenCalledWith('track-1');
  });

  test('toggleRepost: handles 409 Conflict gracefully', async () => {
    
    const conflictError = {
      response: { status: 409, data: { message: 'Already reposted' } }
    };
    mockedService.repostTrack.mockRejectedValue(conflictError);
    
    
    await useRepostStore.getState().toggleRepost(mockTrack);

    const state = useRepostStore.getState();
    expect(state.error).toBeNull(); 
  });
});