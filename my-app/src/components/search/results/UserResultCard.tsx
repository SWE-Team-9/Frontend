import Link from "next/link";
import type { SearchUser } from "@/src/types/search";

interface Props {
  user: SearchUser;
}

export default function UserResultCard({ user }: Props) {
  return (
    <Link
      href={`/profiles/${user.handle ?? user.id}`}
      className="flex items-center gap-3 rounded p-2"
    >
      <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="font-bold">{user.display_name}</div>
    </Link>
  );
}