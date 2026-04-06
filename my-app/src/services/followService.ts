import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface FollowUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
}

export interface FollowListResponse {
  page: number;
  limit: number;
  total: number;
  followers?: FollowUser[];
  following?: FollowUser[];
}

export interface FollowActionResponse {
  message: string;
  targetUserId: string;
  isFollowing: boolean;
  followersCount?: number;
}

export interface SuggestedUser extends FollowUser {
  reason?: string;
}

export interface SuggestionsResponse {
  suggestions: SuggestedUser[];
}

const MOCK_FOLLOWING: FollowUser[] = [
  {
    id: "usr_1",
    display_name: "Drake",
    handle: "drake",
    avatar_url: "",
  },
];

const MOCK_SUGGESTIONS: SuggestedUser[] = [
  {
    id: "usr_2",
    display_name: "Travis Scott",
    handle: "travisscott",
    avatar_url: "",
    reason: "Shared genres",
  },
  {
    id: "usr_3",
    display_name: "Billie Eilish",
    handle: "billieeilish",
    avatar_url: "",
    reason: "Shared genres",
  },
  {
    id: "usr_4",
    display_name: "The Weeknd",
    handle: "theweeknd",
    avatar_url: "",
    reason: "Shared genres",
  },
];

let mockFollowing = [...MOCK_FOLLOWING];
let mockSuggestions = [...MOCK_SUGGESTIONS];

// ===============================
//  FOLLOW USER
// ===============================
export const followUser = async (userId: string): Promise<FollowActionResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const user = mockSuggestions.find((u) => u.id === userId);
    if (user) {
      mockFollowing.push(user);
      mockSuggestions = mockSuggestions.filter((u) => u.id !== userId);
    }
    return {
      message: "User followed successfully",
      targetUserId: userId,
      isFollowing: true,
      followersCount: mockFollowing.length,
    };
  }

  const res = await api.post(`/social/follow/${userId}`);
  return res.data;
};

// ===============================
//  UNFOLLOW USER
// ===============================
export const unfollowUser = async (userId: string): Promise<FollowActionResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const user = mockFollowing.find((u) => u.id === userId);
    if (user) {
      mockFollowing = mockFollowing.filter((u) => u.id !== userId);
      mockSuggestions.push(user);
    }
    return {
      message: "User unfollowed successfully",
      targetUserId: userId,
      isFollowing: false,
    };
  }

  const res = await api.delete(`/social/follow/${userId}`);
  return res.data;
};

// ===============================
//  GET FOLLOWERS LIST
// ===============================
export const getFollowers = async (
  userId: string,
  page = 1,
  limit = 20,
): Promise<FollowListResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      page,
      limit,
      total: 0,
      followers: [],
    };
  }

  const res = await api.get(`/social/${userId}/followers`, {
    params: { page, limit },
  });
  return res.data;
};

// ===============================
//  GET FOLLOWING LIST
// ===============================
export const getFollowing = async (
  userId: string,
  page = 1,
  limit = 20,
): Promise<FollowListResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      page,
      limit,
      total: mockFollowing.length,
      following: mockFollowing,
    };
  }

  const res = await api.get(`/social/${userId}/following`, {
    params: { page, limit },
  });
  return res.data;
};

// ===============================
//  GET SUGGESTED USERS
// ===============================
export const getSuggestions = async (
  limit = 10,
): Promise<SuggestionsResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      suggestions: mockSuggestions.slice(0, limit),
    };
  }

  const res = await api.get(`/social/suggestions`, {
    params: { limit },
  });
  return res.data;
};

export const socialService = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions,
};
