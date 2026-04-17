
import api from '@/src/services/api';
import { 
  repostTrack, 
  removeRepost, 
  getUserReposts 
} from '@/src/services/repostService';
import { UserInteractionResponse, TrackData } from '@/src/types/interactions';

// Mock base API
jest.mock('@/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('repostService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('repostTrack: sends POST request', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'Reposted' } });
    
    const result = await repostTrack('track_123');
    
    expect(mockedApi.post).toHaveBeenCalledWith('/interactions/tracks/track_123/repost');
    expect(result.message).toBe('Reposted');
  });

  test('removeRepost: sends DELETE request', async () => {
    mockedApi.delete.mockResolvedValue({ data: { message: 'Removed' } });
    
    const result = await removeRepost('track_123');
    
    expect(mockedApi.delete).toHaveBeenCalledWith('/interactions/tracks/track_123/repost');
    expect(result.message).toBe('Removed');
  });

  test('getUserReposts: transforms nested API data correctly', async () => {
    
    const mockApiResponse: { data: UserInteractionResponse }  = {
      data: {
        items: [
          {
            interactedAt: '2026-04-13',
            track: {
              id: 'track_1',
              title: 'Starboy',
              likesCount: 10,
              repostsCount: 5,
              coverArtUrl: null
            }as TrackData
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockApiResponse);

    const result = await getUserReposts('user_123');

    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Starboy');
    const flattenedTrack = result[0] as TrackData & { interactedAt: string };
    expect(flattenedTrack.interactedAt).toBe('2026-04-13');
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/interactions/users/user_123/reposts',
      expect.objectContaining({ params: { page: 1, limit: 20 } })
    );
  });

  test('getUserReposts: returns empty array if response data is missing', async () => {
    mockedApi.get.mockResolvedValue({ data: null });
    const result = await getUserReposts('user_123');
    expect(result).toEqual([]);
  });
});