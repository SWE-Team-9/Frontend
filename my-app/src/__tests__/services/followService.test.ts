
import api from '@/src/services/api';
import * as FollowServiceNamespace from '@/src/services/followService';
import { 
  followUser, 
  unfollowUser, 
  getFollowing, 
  getFollowers,
  
} from '@/src/services/followService';

jest.mock('@/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe("followService - Error Handling", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle error from server when follow fails", async () => {
    const errorResponse = { response: { data: { message: "Error" } } };
    mockedApi.post.mockRejectedValueOnce(errorResponse);
    await expect(followUser("user-123")).rejects.toMatchObject(errorResponse);
  });

  it("should handle server errors during unfollow without crashing", async () => {
    const errorResponse = { response: { status: 500 } };
    mockedApi.delete.mockRejectedValueOnce(errorResponse);
    await expect(unfollowUser("user-123")).rejects.toMatchObject(errorResponse);
  });

  it("should handle null response in getFollowers", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: null });
    const result = await getFollowers("user-123");
    expect(result).toBeNull(); 
  });
});

describe("followService - Success Cases", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('followUser: sends POST request to correct endpoint', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'Followed' } });
    const result = await followUser('user_123');
    expect(mockedApi.post).toHaveBeenCalledWith('/social/follow/user_123');
    expect(result?.message).toBe('Followed');
  });

  test('getFollowing: fetches following list with pagination', async () => {
    mockedApi.get.mockResolvedValue({ data: { following: [], total: 0 } });
    await getFollowing('user_123', 1, 20);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/social/user_123/following',
      expect.objectContaining({ params: { page: 1, limit: 20 } })
    );
  });
});

describe("followService - Mock Mode Coverage", () => {
  let mockService: typeof FollowServiceNamespace;
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";

    jest.isolateModules(() => {
      /* The linter forbids require, but we need it here to force a 
         fresh module evaluation with the updated process.env.
      */
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mockService = require('@/src/services/followService')as typeof FollowServiceNamespace;  
    });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
  });

  test('followUser (Mock): successfully updates mock state', async () => {
    const result = await mockService.followUser('usr_2');
    expect(result.message).toBe("User followed successfully");
    expect(result.isFollowing).toBe(true);
  });

  test('unfollowUser (Mock): successfully updates mock state', async () => {
    const result = await mockService.unfollowUser('usr_1');
    expect(result.message).toBe("User unfollowed successfully");
    expect(result.isFollowing).toBe(false);
  });

  test('getFollowing (Mock): returns mock following list', async () => {
    const result = await mockService.getFollowing('any_id');
    expect(result.following).toBeDefined();
    expect(Array.isArray(result.following)).toBe(true);
  });

 test('getFollowers (Mock): returns empty mock list', async () => {
  const result = await mockService.getFollowers('any_id');
expect(result.followers?.length).toBeGreaterThan(0);
  expect(result.total).toBeGreaterThan(0);
});

  test('getSuggestions (Mock): returns sliced mock list', async () => {
    const result = await mockService.getSuggestions(2);
    expect(result.suggestions.length).toBeLessThanOrEqual(2);
  });
});