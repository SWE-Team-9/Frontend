export const blockUser = async (userId: string) => {
  const res = await fetch(`/api/v1/social/block/${userId}`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to block user");

  return res.json();
};

export const unblockUser = async (userId: string) => {
  const res = await fetch(`/api/v1/social/block/${userId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to unblock user");

  return res.json();
};

export const getBlockedUsers = async (page = 1, limit = 20) => {
  const res = await fetch(
    `/api/v1/social/blocked-users?page=${page}&limit=${limit}`
  );

  if (!res.ok) throw new Error("Failed to fetch blocked users");

  return res.json();
};