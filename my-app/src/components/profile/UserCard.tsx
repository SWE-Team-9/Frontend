import Image from "next/image";
import Link from "next/link";

// User data structure definition
interface User {
  id: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  handle?: string;
  avatar?: string;
  avatar_url?: string;
  avatarUrl?: string;
  followers?: number | string;
  followersCount?: number;
  followers_count?: number;
  isFollowing?: boolean;
}

// Props for UserCard component
interface UserCardProps {
  user: User;
  onAction: (id: string) => void;
  type: "follow" | "block" | "suggest";
}

// Helper to get followers count - same logic as ProfilePage
const getFollowersCount = (user: User): string => {
  if (typeof user.followers === "number") return user.followers.toString();
  if (typeof user.followers === "string") return user.followers;
  if (typeof user.followersCount === "number") return user.followersCount.toString();
  if (typeof user.followers_count === "number") return user.followers_count.toString();
  return "0";
};

// Helper to get display name
const getDisplayName = (user: User): string => {
  return user.displayName ?? user.display_name ?? user.name ?? "Unknown";
};

// Helper to get avatar URL
const getAvatarUrl = (user: User): string | null => {
  return user.avatarUrl ?? user.avatar_url ?? user.avatar ?? null;
};

// Main UserCard component
export const UserCard = ({ user, onAction, type }: UserCardProps) => {
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  const followersCount = getFollowersCount(user);
  const profileHref = user.handle ? `/profiles/${user.handle}` : "#";

  return (
    <div className="flex flex-col items-center text-center group">
      <Link href={profileHref} className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all duration-300 shadow-2xl bg-zinc-900">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-zinc-500 uppercase">
                {displayName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <h4 className="font-bold text-white text-sm flex items-center gap-1 mb-1 uppercase tracking-wider">
          {displayName}
        </h4>

        <p className="text-zinc-500 text-[11px] mb-4">
          {followersCount} {parseInt(followersCount) === 1 ? "follower" : "followers"}
        </p>
      </Link>

      <button
        onClick={() => onAction(user.id)}
        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
          user.isFollowing
            ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
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