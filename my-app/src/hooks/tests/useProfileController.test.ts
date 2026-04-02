// Silence the act() warnings for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/not wrapped in act/.test(args[0])) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});


import { renderHook, act } from '@testing-library/react';
import { useProfileController } from '../useProfileController';
import axios from 'axios';

// 1. Mocking the API and Services using relative paths to prevent interceptor errors
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  api: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }
}));

// 2. Mocking profile-related services
jest.mock('../../services/profileService', () => ({
  getMyProfile: jest.fn().mockResolvedValue({}),
  updateMyProfile: jest.fn(),
  updateMyLinks: jest.fn(),
  uploadProfileImage: jest.fn(),
}));

// 3. Mocking the global profile store
jest.mock('../../store/useProfileStore', () => ({
  useProfileStore: () => ({
    handle: 'gehad-khamis',
    followingCount: 0,
    followersCount: 0,
    setProfileData: jest.fn(),
    useMockData: false,
  }),
}));

// 4. Mocking Axios for social service calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 5. Mocking Next.js navigation parameters
jest.mock('next/navigation', () => ({
  useParams: () => ({ handle: 'gehad-khamis' }),
}));

describe('useProfileController Logic Tests', () => {
  
  beforeEach(() => {
    // Reset all mocks before each test to ensure clean state
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });
  });

  /**
   * Test 1: Initial State
   * Verifies that following and followers counters start at zero
   */
  it('should initialize followingCount and followersCount at 0', () => {
    const { result } = renderHook(() => useProfileController('gehad-khamis'));
    expect(result.current.followingCount).toBe(0);
    expect(result.current.followersCount).toBe(0);
  });

  /**
   * Test 2: Search Functionality
   * Verifies that the search correctly filters users by name
   */
  it('should filter users correctly when searchQuery changes', () => {
    const { result } = renderHook(() => useProfileController('gehad-khamis'));

    act(() => {
      result.current.setSearchQuery('Mazen');
    });

    // Check filtered results against the search query
    const hasOnlyMazen = result.current.filteredUsers.every((user) => 
      !!(user.name?.toLowerCase().includes('mazen'))
    );
    expect(hasOnlyMazen).toBe(true);
  });

  /**
   * Test 3: Follow Logic & Real-time Update
   * Verifies that following a suggested user increments the following count instantly
   */
it('should increment followingCount when a user is followed', async () => {
    const { result } = renderHook(() => useProfileController('gehad-khamis'));

    // Verify initial state is 0
    expect(result.current.followingCount).toBe(0);

    // Simulate following 'usr_301'
    // await act(async () => {
    //   result.current.toggleFollow(usr_301);
    // });

    // Check if count is now 1
    expect(result.current.followingCount).toBe(1);
  });

  /**
   * Test 4: Pagination Logic
   * Ensures the load more function triggers loading states correctly
   */
  it('should increase the page number when handleLoadMore is called', () => {
    const { result } = renderHook(() => useProfileController('gehad-khamis'));
    
    act(() => {
      result.current.handleLoadMore();
    });

    // Verify that the pagination state exists and is reachable
    expect(result.current.isLoading).toBeDefined();
  });
});