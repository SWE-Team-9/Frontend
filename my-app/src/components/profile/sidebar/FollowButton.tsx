"use client";

import { useFollowStore } from "@/src/store/followStore";
import { User } from "@/src/types/user";

interface FollowButtonProps {
  user: User;
}

export default function FollowButton({ user }: FollowButtonProps) {
  const { toggleFollow, isFollowing, loadingIds } = useFollowStore();

  // The button checks the global store directly to see if this ID is followed
  const following = isFollowing(user.id);
  const loading = !!loadingIds[user.id];

  return (
    <button
      onClick={() => toggleFollow(user)}
      disabled={loading}
      className={`px-3 py-1 text-xs font-bold rounded transition-all min-w-[80px] ${
        following
          ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
          : "bg-white text-black hover:bg-zinc-200"
      }`}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}