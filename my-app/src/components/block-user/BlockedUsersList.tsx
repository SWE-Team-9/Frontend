import React from "react";
import { useBlockStore } from "@/src/store/useblockStore";
import Image from "next/image";

interface BlockedUsersListProps {
  loadingUserId: string | null;
}

const BlockedUsersList: React.FC<BlockedUsersListProps> = ({
  loadingUserId,
}) => {
  const { blockedUsers, blockUser, unblockUser } = useBlockStore();

  return (
    <ul className="divide-y divide-zinc-800">
      {blockedUsers.map((user) => (
        <li
          key={user.id}
          className="flex items-center justify-between py-3 gap-4"
        >
          <div className="flex items-center gap-3">
            <Image src={user.avatar_url} alt={user.display_name} width={50} height={50} className="rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium">{user.display_name}</p>
              <p className="text-xs text-zinc-400">@{user.handle}</p>
            </div>
          </div>
          <button
            onClick={() =>
              blockedUsers.some((u) => u.id === user.id)
                ? unblockUser(user.id)
                : blockUser(user.id)
            }
            disabled={loadingUserId === user.id}
            className="px-3 py-1 text-sm rounded bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {loadingUserId === user.id
              ? "Processing…"
              : blockedUsers.some((u) => u.id === user.id)
                ? "Unblock"
                : "Block"}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default BlockedUsersList;
