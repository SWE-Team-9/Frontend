
import api from '@/src/services/api';
import { likeTrack, unlikeTrack, getUserLikes } from '@/src/services/likeService';
import { UserInteractionResponse, TrackData } from '@/src/types/interactions';

type TestTrackData = TrackData & { artistHandle?: string };
jest.mock('@/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('likeService -  Coverage Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- POST / DELETE ---

  test('likeTrack: sends POST request and returns data', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'success', liked: true } });
    const result = await likeTrack('t1');
    expect(mockedApi.post).toHaveBeenCalledWith('/interactions/tracks/t1/like');
    expect(result.liked).toBe(true);
  });

  test('unlikeTrack: sends DELETE request and returns data', async () => {
    mockedApi.delete.mockResolvedValue({ data: { message: 'removed', liked: false } });
    const result = await unlikeTrack('t1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/interactions/tracks/t1/like');
    expect(result.message).toBe('removed');
  });

  // --- GET /user-likes ---

  test('getUserLikes: maps raw response and exercises all fallback branches', async () => {
    const rawData: Partial<UserInteractionResponse> = {
      items: [
        {
          interactedAt: '2024-01-01',
          track: {
            id: 't1',
            title: null as unknown as string, 
            artistName: null, 
            artistHandle: 'handle_1',
            coverArtUrl: 'url_primary.jpg', 
            likesCount: null as unknown as number, 
          } as unknown as TrackData
        },
        {
          interactedAt: '2024-01-02',
          track: {
            id: 't2',
            title: 'Real Title',
            imageUrl: 'url_alt.png',
            coverArt: 'url_alt.png'
          } as unknown as TrackData
        }
      ]
    };

    mockedApi.get.mockResolvedValue({ data: rawData });

    const result = await getUserLikes('u1');

    // Verification for Item 0
    const item0 = result[0] as TestTrackData;
    expect(item0.title).toBe('Untitled Track');
    expect(item0.artistName).toBeUndefined();
    expect(item0.artistHandle).toBe('handle_1');
    expect(item0.likesCount).toBe(0);
    expect(item0.coverArt).toBe('url_primary.jpg');

    // Verification for Item 1
    const item1 = result[1] as TestTrackData;
    expect(item1.title).toBe('Real Title');
    expect(item1.imageUrl).toBe('url_alt.png');
  });

  test('getUserLikes: handles missing artistHandle field gracefully', async () => {
    const rawData = {
      items: [{
        track: { id: 't1', title: 'Song' } 
      }]
    };
    mockedApi.get.mockResolvedValue({ data: rawData });
    const result = await getUserLikes('u1');
    const track = result[0] as TestTrackData;
    expect(track.artistHandle).toBeUndefined();
  });

  test('getUserLikes: returns empty array if response data is missing items', async () => {
    mockedApi.get.mockResolvedValue({ data: {} }); 
    const result = await getUserLikes('u1');
    expect(result).toEqual([]);
  });

  test('getUserLikes: handles different image field priorities', async () => {
    const rawData = {
      items: [{
        track: { 
          id: 't1', 
          coverArt: 'priority_1.jpg' 
        }
      }]
    };
    mockedApi.get.mockResolvedValue({ data: rawData });
    const result = await getUserLikes('u1');
    expect(result[0].coverArt).toBe('priority_1.jpg');
    expect(result[0].imageUrl).toBe('priority_1.jpg');
  });
});