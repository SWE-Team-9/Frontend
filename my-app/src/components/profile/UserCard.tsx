import Image from "next/image";
import Link from "next/link";

interface User {
  id: string;
  name?: string;
  display_name?: string;
  handle?: string;
  avatar?: string;
  avatar_url?: string;
  followers?: number | string;
  isFollowing?: boolean;
}

interface UserCardProps {
  user: User;
  onAction: (id: string) => void;
  type: "follow" | "block" | "suggest";
}

export const UserCard = ({ user, onAction, type }: UserCardProps) => {
  const profileHref = user.handle ? `/profiles/${user.handle}` : "#";

  return (
    <div className="flex flex-col items-center text-center group">
      <Link href={profileHref} className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all duration-300 shadow-2xl bg-zinc-900">
          {(user.avatar || user.avatar_url) && (
            <Image
              src={user.avatar || user.avatar_url || ""}
              alt={user.name || user.display_name || ""}
              fill
              className="object-cover"
            />
          )}
        </div>
        <h4 className="font-bold text-white text-sm flex items-center gap-1 mb-1 uppercase tracking-wider">
          {user.name || user.display_name}{" "}
          <span className="text-[#38bdf8] text-[10px]">✓</span>
        </h4>
        <p className="text-zinc-500 text-[11px] mb-4">
           {user.followers || "0"} followers
        </p>
      </Link>

      <button
        onClick={() => onAction(user.id)}
        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
          user.isFollowing
            ? "bg-zinc-800 text-zinc-400"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {type === "follow"
          ? user.isFollowing
            ? "Following"
            : "Follow"
          : type.toUpperCase()}
      </button>
    </div>
  );
};