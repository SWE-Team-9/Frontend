import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface BlockedUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  blockedAt: string;
}

export interface BlockedUsersResponse {
  page: number;
  limit: number;
  total: number;
  blockedUsers: BlockedUser[];
}

const MOCK_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "user-001",
    display_name: "Alex Rivera",
    handle: "alexrivera",
    avatar_url: "https://i.pravatar.cc/150?img=9",
    blockedAt: "2026-03-07T11:00:00Z",
  },
  {
    id: "user-002",
    display_name: "Jordan Lee",
    handle: "jordanlee",
    avatar_url: "https://i.pravatar.cc/150?img=1",
    blockedAt: "2026-03-08T09:30:00Z",
  },
  {
    id: "user-003",
    display_name: "Sam Chen",
    handle: "samchen",
    avatar_url: "https://i.pravatar.cc/150?img=7",
    blockedAt: "2026-03-09T14:15:00Z",
  },
];

const mockBlockedIds = new Set<string>(MOCK_BLOCKED_USERS.map((u) => u.id));

// ===============================
//  BLOCK USER
// ===============================
export const blockUser = async (userId: string) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    mockBlockedIds.add(userId);
    return { message: "User blocked successfully", blockedUserId: userId };
  }
  console.log("BLOCK USER ID:", userId);
  const res = await api.post(`/social/block/${userId}`);
  return res.data;
};

// ===============================
//  UNBLOCK USER
// ===============================
export const unblockUser = async (userId: string) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    mockBlockedIds.delete(userId);
    return { message: "User unblocked successfully", blockedUserId: userId };
  }

  const res = await api.delete(`/social/block/${userId}`);
  return res.data;
};

// ===============================
//  GET BLOCKED USERS
// ===============================
export const getBlockedUsers = async (
  page = 1,
  limit = 20,
): Promise<BlockedUsersResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const allBlocked = MOCK_BLOCKED_USERS.filter((u) =>
      mockBlockedIds.has(u.id),
    );
    const start = (page - 1) * limit;
    return {
      page,
      limit,
      total: allBlocked.length,
      blockedUsers: allBlocked.slice(start, start + limit),
    };
  }

  const res = await api.get(
    `/social/blocked-users?page=${page}&limit=${limit}`,
  );
  return res.data;
};
