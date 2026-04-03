"use client";

import Image from "next/image";
import { FollowButton } from "./FollowButton";

export interface UserCardUser {
  userId: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string | null;
  location?: string;
  tracksCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

interface UserCardProps {
  user: UserCardUser;
  onFollowSuccess?: (userId: string, isFollowing: boolean) => void;
  showFollowButton?: boolean;
  compact?: boolean;
}

export function UserCard({
  user,
  onFollowSuccess,
  showFollowButton = true,
  compact = false,
}: UserCardProps) {
  const { userId, displayName, handle, avatarUrl, location, tracksCount, followersCount, isFollowing } = user;

  // Compact layout (small cards for lists)
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-900/60 transition-colors">
        <Avatar avatarUrl={avatarUrl} displayName={displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{displayName}</p>
          {handle && <p className="text-xs text-zinc-500 truncate">@{handle}</p>}
        </div>
        {showFollowButton && (
          <FollowButton
            userId={userId}
            initialIsFollowing={isFollowing}
            onSuccess={(following) => onFollowSuccess?.(userId, following)}
          />
        )}
      </div>
    );
  }

  // Full layout
  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-sm p-4 gap-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar avatarUrl={avatarUrl} displayName={displayName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{displayName}</p>
          {handle && <p className="text-xs text-zinc-500 truncate">@{handle}</p>}
          {location && <p className="text-xs text-zinc-600 truncate mt-0.5">{location}</p>}
        </div>
        {showFollowButton && (
          <FollowButton
            userId={userId}
            initialIsFollowing={isFollowing}
            onSuccess={(following) => onFollowSuccess?.(userId, following)}
          />
        )}
      </div>

      {(tracksCount !== undefined || followersCount !== undefined) && (
        <div className="flex gap-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          {tracksCount !== undefined && (
            <span>
              <span className="text-white font-bold">{tracksCount}</span> Tracks
            </span>
          )}
          {followersCount !== undefined && (
            <span>
              <span className="text-white font-bold">{followersCount}</span> Followers
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Avatar component
function Avatar({
  avatarUrl,
  displayName,
  size,
}: {
  avatarUrl?: string | null;
  displayName: string;
  size: "sm" | "md";
}) {
  const dim = size === "sm" ? 32 : 44;
  const cls = size === "sm" ? "w-8 h-8" : "w-11 h-11";

  return (
    <div className={`${cls} rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden relative`}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={dim}
          height={dim}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
          {displayName.charAt(0)}
        </span>
      )}
    </div>
  );
}