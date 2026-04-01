import axios from "axios";

/** * Base URL for social endpoints. 
 * Note: Currently bypassed by Mock Data to avoid 404 errors until Backend is ready.
 */
const BASE_URL = "/api/v1/social";

/** * Mock data for testing purposes. 
 * Replaces live API responses to test UI and interaction logic.
 */
const MOCK_USERS = [
  { id: "1", name: "Doja Cat", handle: "dojacat", followers: "2M", isFollowing: true, avatar: "https://ui-avatars.com/api/?name=Doja+Cat" },
  { id: "2", name: "Bad-Bunny", handle: "badbunny", followers: "3M", isFollowing: true, avatar: "https://ui-avatars.com/api/?name=Bad+Bunny" },
  { id: "3", name: "Travis Scott", handle: "travisscott", followers: "6.22M", isFollowing: true, avatar: "https://ui-avatars.com/api/?name=Travis+Scott" },
  { id: "4", name: "Mazen LoFi", handle: "mazen", followers: "500", isFollowing: false, avatar: "https://ui-avatars.com/api/?name=Mazen" },
];

export const socialService = {
  
  /** * Follow/Unfollow Logic
   * Simulates a server request and logs the action to the console.
   */
  followUser: async (userId: string) => {
    console.log("Mock Follow Action for user ID:", userId);
    return { status: 200, data: { success: true } };
  },

  unfollowUser: async (userId: string) => {
    console.log("Mock Unfollow Action for user ID:", userId);
    return { status: 200, data: { success: true } };
  },

  /** * Fetches the list of followers for a specific user.
   * Currently returns a subset of MOCK_USERS.
   */
  getFollowers: async (userId: string, page = 1, limit = 20) => {
    console.log("Fetching Mock Followers List");
    return { data: { data: MOCK_USERS.slice(0, 2) } }; 
  },
  
  /** * Fetches the list of users that the current user is following.
   * Returns mock users where isFollowing is true.
   */
  getFollowing: async (userId: string, page = 1, limit = 20) => {
    console.log("Fetching Mock Following List");
    return { data: { data: MOCK_USERS.filter(u => u.isFollowing) } };
  },

  /** * Fetches suggested users to follow.
   * Returns mock users where isFollowing is false.
   */
  getSuggestions: async (limit = 10) => {
    console.log("Fetching Mock Suggestions List");
    return { data: { data: MOCK_USERS.filter(u => !u.isFollowing) } };
  },

  /** * Block Management
   * Mocked functions to resolve immediately without backend calls.
   */
  blockUser: (userId: string) => {
    console.log("Mock Block for user:", userId);
    return Promise.resolve({ data: { success: true } });
  },

  unblockUser: (userId: string) => {
    console.log("Mock Unblock for user:", userId);
    return Promise.resolve({ data: { success: true } });
  },

  getBlockedUsers: (page = 1, limit = 20) => {
    console.log("Fetching Mock Blocked Users");
    return Promise.resolve({ data: { data: [] } });
  },
};