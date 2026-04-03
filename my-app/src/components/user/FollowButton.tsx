"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;                // required by UserCard
  initialIsFollowing?: boolean;  // matches UserCard's isFollowing
  onSuccess?: (isFollowing: boolean) => void; // callback for UserCard
  className?: string;
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  onSuccess,
  className = "",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    onSuccess?.(nextState); // notify UserCard about the change
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        px-4 py-1.5 text-xs font-bold uppercase tracking-wide
        border rounded-sm transition-all duration-150
        ${isFollowing
          ? "bg-transparent border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
          : "bg-transparent border-zinc-500 text-white hover:border-white hover:text-white"
        }
        ${className}
      `}
      aria-label={isFollowing ? "Unfollow" : "Follow"}
    >
      {isFollowing ? (isHovering ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
}