import api from "@/src/services/api";

const BASE_URL = "/api/v1/social";
const USE_MOCK = true; // Toggle this to switch between mock and real API

// --- Internal Mock State ---
let mockFollowing = [
  { id: "usr_1", display_name: "Drake", avatar_url: "" },
];

let mockSuggestions = [
  { id: "usr_2", display_name: "Travis Scott", avatar_url: "" },
  { id: "usr_3", display_name: "Billie Eilish", avatar_url: "" },
  { id: "usr_4", display_name: "The Weeknd", avatar_url: "" },
];

let mockBlocked = [] as any[];

// --- Implementation Logic ---

export const followUser = async (userId: string) => {
  if (USE_MOCK) {
    const user = mockSuggestions.find((u) => u.id === userId);
    if (user) {
      mockFollowing.push(user);
      mockSuggestions = mockSuggestions.filter((u) => u.id !== userId);
    }
    return { data: { message: "Followed", isFollowing: true } };
  }
  return await api.post(`${BASE_URL}/follow/${userId}`);
};

export const unfollowUser = async (userId: string) => {
  if (USE_MOCK) {
    const user = mockFollowing.find((u) => u.id === userId);
    if (user) {
      mockFollowing = mockFollowing.filter((u) => u.id !== userId);
      mockSuggestions.push(user);
    }
    return { data: { message: "Unfollowed", isFollowing: false } };
  }
  return await api.delete(`${BASE_URL}/follow/${userId}`);
};

export const getFollowing = async (userId: string, page = 1, limit = 20) => {
  if (USE_MOCK) {
    return { data: { following: mockFollowing, total: mockFollowing.length } };
  }
  return await api.get(`${BASE_URL}/${userId}/following`, { params: { page, limit } });
};

export const getFollowers = async (userId: string, page = 1, limit = 20) => {
  if (USE_MOCK) {
    return { data: { followers: [], total: 0 } };
  }
  return await api.get(`${BASE_URL}/${userId}/followers`, { params: { page, limit } });
};

export const getSuggestions = async (limit = 10) => {
  if (USE_MOCK) {
    return { data: { suggestions: mockSuggestions.slice(0, limit) } };
  }
  return await api.get(`${BASE_URL}/suggestions`, { params: { limit } });
};

export const blockUser = async (userId: string) => {
  if (USE_MOCK) {
    mockBlocked.push({ id: userId });
    return { data: { message: "Blocked" } };
  }
  return await api.post(`${BASE_URL}/block/${userId}`);
};

export const unblockUser = async (userId: string) => {
  if (USE_MOCK) {
    mockBlocked = mockBlocked.filter(u => u.id !== userId);
    return { data: { message: "Unblocked" } };
  }
  return await api.delete(`${BASE_URL}/unblock/${userId}`);
};

export const getBlockedUsers = async (page = 1, limit = 20) => {
  if (USE_MOCK) {
    return { data: { blocked: mockBlocked } };
  }
  return await api.get(`${BASE_URL}/blocked-users`, { params: { page, limit } });
};

// --- THE ALIASING (The "Magic" for her code) ---
// This object maps her old function names to your new ones 
// so her existing code NEVER breaks.
export const socialService = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions,
  blockUser,
  unblockUser,
  getBlockedUsers,
};