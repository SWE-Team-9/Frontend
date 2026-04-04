const BASE_URL = "/api/v1/social";

const USE_MOCK = true; // toggle this to switch between mock and real API

// Internal mock state (simulates database)
let mockFollowing = [
  { id: "usr_1", display_name: "Drake", avatar_url: "" },
];

let mockSuggestions = [
  { id: "usr_2", display_name: "Travis Scott", avatar_url: "" },
  { id: "usr_3", display_name: "Billie Eilish", avatar_url: "" },
  { id: "usr_4", display_name: "The Weeknd", avatar_url: "" },
];

// FOLLOW USER
export const followUser = async (userId: string) => {
  if (USE_MOCK) {
    console.log("MOCK follow:", userId);

    const user = mockSuggestions.find((u) => u.id === userId);

    if (user) {
      //  add to following
      mockFollowing.push(user);

      // remove from suggestions
      mockSuggestions = mockSuggestions.filter((u) => u.id !== userId);
    }

    return {
      message: "User followed successfully",
      targetUserId: userId,
      isFollowing: true,
      followersCount: mockFollowing.length,
    };
  }

  const res = await fetch(`${BASE_URL}/follow/${userId}`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to follow");

  return res.json();
};

//  UNFOLLOW USER
export const unfollowUser = async (userId: string) => {
  if (USE_MOCK) {
    console.log("MOCK unfollow:", userId);

    const user = mockFollowing.find((u) => u.id === userId);

    if (user) {
      //  remove from following
      mockFollowing = mockFollowing.filter((u) => u.id !== userId);

      //  add back to suggestions
      mockSuggestions.push(user);
    }

    return {
      message: "User unfollowed successfully",
      targetUserId: userId,
      isFollowing: false,
    };
  }

  const res = await fetch(`${BASE_URL}/follow/${userId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to unfollow");

  return res.json();
};

// GET FOLLOWING
export const getFollowing = async (userId: string) => {
  if (USE_MOCK) {
    return {
      page: 1,
      limit: 20,
      total: mockFollowing.length,
      following: mockFollowing,
    };
  }

  const res = await fetch(
    `${BASE_URL}/${userId}/following?page=1&limit=20`
  );

  if (!res.ok) throw new Error("Failed to fetch following");

  return res.json();
};

// GET FOLLOWERS (optional for later)
export const getFollowers = async (userId: string) => {
  if (USE_MOCK) {
    return {
      page: 1,
      limit: 20,
      total: 0,
      followers: [],
    };
  }

  const res = await fetch(
    `${BASE_URL}/${userId}/followers?page=1&limit=20`
  );

  if (!res.ok) throw new Error("Failed to fetch followers");

  return res.json();
};

//  GET SUGGESTIONS
export const getSuggestions = async () => {
  if (USE_MOCK) {
    return {
      suggestions: mockSuggestions,
    };
  }

  const res = await fetch(`${BASE_URL}/suggestions?limit=10`);

  if (!res.ok) throw new Error("Failed to fetch suggestions");

  return res.json();
};