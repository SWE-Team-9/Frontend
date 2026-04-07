"use client";

import { useFollowStore } from "@/src/store/followStore";
import { FollowUser } from "@/src/services/followService";

interface FollowButtonProps {
  user: FollowUser;
}

export default function FollowButton({ user }: FollowButtonProps) {
  const { toggleFollow, isFollowing, loadingIds, error, clearError } =
    useFollowStore();

  const following = isFollowing(user.id);
  const loading = !!loadingIds[user.id];

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={async () => {
          clearError();
          await toggleFollow(user);
        }}
        disabled={loading}
        className={`px-3 py-1 text-xs font-bold rounded transition-all min-w-20 ${
          following
            ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {loading ? "..." : following ? "Following" : "Follow"}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
