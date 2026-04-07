import axios from "axios";

/** * Base URL for social endpoints as per Module 3 Documentation.
 */
const BASE_URL = "/api/v1/social";

export const socialService = {
  
  /** * 1. Follow User
   * Method: POST /api/v1/social/follow/{userId}
   */
  followUser: async (userId: string) => {
    return await axios.post(`${BASE_URL}/follow/${userId}`);
  },

  /** * 2. Unfollow User
   * Method: DELETE /api/v1/social/follow/{userId}
   */
  unfollowUser: async (userId: string) => {
    return await axios.delete(`${BASE_URL}/follow/${userId}`);
  },

  /** * 3. Get Followers List
   * Method: GET /api/v1/social/{userId}/followers
   */
  getFollowers: async (userId: string, page = 1, limit = 20) => {
    return await axios.get(`${BASE_URL}/${userId}/followers`, {
      params: { page, limit }
    });
  },
  
  /** * 4. Get Following List
   * Method: GET /api/v1/social/{userId}/following
   */
  getFollowing: async (userId: string, page = 1, limit = 20) => {
    return await axios.get(`${BASE_URL}/${userId}/following`, {
      params: { page, limit }
    });
  },

  /** * 5. Suggested Users
   * Method: GET /api/v1/social/suggestions
   */
  getSuggestions: async (limit = 10) => {
    return await axios.get(`${BASE_URL}/suggestions`, {
      params: { limit }
    });
  },

  /** * 6. Block User
   * Method: POST /api/v1/social/block/{userId}
   */
  blockUser: async (userId: string) => {
    return await axios.post(`${BASE_URL}/block/${userId}`);
  },

  /** * 7. Unblock User
   * Method: DELETE /api/v1/social/block/{userId}
   */
  unblockUser: async (userId: string) => {
    return await axios.delete(`${BASE_URL}/block/${userId}`);
  },

  /** * 8. Get Blocked Users
   * Method: GET /api/v1/social/blocked-users
   */
  getBlockedUsers: async (page = 1, limit = 20) => {
    return await axios.get(`${BASE_URL}/blocked-users`, {
      params: { page, limit }
    });
  },
};