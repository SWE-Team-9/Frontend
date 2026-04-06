import React from "react";
import { useBlockStore } from "@/src/store/useblockStore";
import Image from "next/image";

interface BlockedUsersListProps {
  loadingUserId: string | null;
}

const BlockedUsersList: React.FC<BlockedUsersListProps> = () => {
  const { blockedUsers, unblockUser, loadingUserId, error, clearError } = useBlockStore();

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center justify-between bg-red-900/40 border border-red-600 text-red-300 text-sm font-bold px-4 py-2 rounded-lg">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-white ml-4">×</button>
        </div>
      )}

      <ul className="divide-y divide-zinc-800">
        {blockedUsers.map((user) => (
          <li key={user.id} className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.display_name}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                  {user.display_name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{user.display_name || "Unknown"}</p>
                {user.handle && <p className="text-xs text-zinc-400">@{user.handle}</p>}
              </div>
            </div>
            <button
              onClick={() => unblockUser(user.id)}
              disabled={loadingUserId === user.id}
              className="px-3 py-1 text-sm font-bold text-[#ff5500] rounded bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {loadingUserId === user.id ? "Processing…" : "Unblock"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlockedUsersList;