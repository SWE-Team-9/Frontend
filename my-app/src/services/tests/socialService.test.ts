import axios from 'axios';
import { socialService } from '../socialService';

// Mock axios to prevent real API calls during testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Social Service Endpoints', () => {
  
  /**
   * Test 1: Follow User
   * Verifies that the POST request is sent to the correct endpoint
   */
  it('should send a POST request to the correct follow endpoint', async () => {
    // Mocking the resolved value of the post request
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    
    await socialService.followUser('usr_100');
    
    // Validate if the URL structure matches the API documentation
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/social/follow/usr_100');
  });

  /**
   * Test 2: Get Followers List
   * Verifies the GET request includes correct URL and query parameters
   */
  it('should send a GET request for followers with correct query params', async () => {
    // Mocking the followers list response
    mockedAxios.get.mockResolvedValue({ data: { followers: [] } });
    
    await socialService.getFollowers('usr_100', 1, 20);
    
    // Check if the URL and the params (pagination) are correct
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/social/usr_100/followers', {
      params: { page: 1, limit: 20 }
    });
  });
})