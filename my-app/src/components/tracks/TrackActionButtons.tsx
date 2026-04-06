import { useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiRepost } from "react-icons/bi";
import { RiShareForwardLine } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";
import { useLikeStore } from '@/src/store/likeStore'; 
import { useRepostStore } from '@/src/store/repostStore';

export interface TrackActionButtonsProps {
  trackId: string;
  title: string;
  artistName: string; // Added
  coverArt?: string;   // Added
  likesCount: number;
  liked: boolean;
  repostsCount: number;
  reposted: boolean;
  size?: "compact" | "full";
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface SCButtonProps {
  active?: boolean;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  count?: number;
  size?: "compact" | "full";
  disabled?: boolean;
}

function SCButton({ active, onClick, label, children, count, size = "full", disabled }: SCButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-1.5 h-[30px] px-2.5 rounded border transition-all duration-150 select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${active ? "border-[#ff5500] bg-[#ff5500]/10 text-[#ff5500]" : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"}
      `}
    >
      <span className={`flex items-center transition-transform duration-100 group-active:scale-90 ${active ? "text-[#ff5500]" : ""}`}>
        {children}
      </span>
      {size === "full" && typeof count === "number" && count > 0 && (
        <span className={`text-[11px] font-medium tabular-nums leading-none ${active ? "text-[#ff5500]" : "text-[#777] group-hover:text-[#aaa]"}`}>
          {fmtCount(count)}
        </span>
      )}
    </button>
  );
}
export function RepostButton({
  trackId,
  reposted,
  repostsCount,
  size = "full",
}: {
  trackId: string;
  reposted: boolean;
  repostsCount: number;
  size?: "compact" | "full";
}) {
  const { toggleRepost, repostedTrackIds } = useRepostStore();
  const idString = String(trackId);
  // We check the global store to see if this track is currently reposted
  const isCurrentlyReposted = repostedTrackIds.has(trackId);

  const handleToggle = async () => {
    // We pass the trackId and its CURRENT state to the store
    await toggleRepost(trackId, isCurrentlyReposted);
  };

  return (
    <SCButton
      active={isCurrentlyReposted}
      onClick={handleToggle}
      label={isCurrentlyReposted ? "Undo Repost" : "Repost"}
      count={repostsCount}
      size={size}
    >
      <BiRepost size={18} />
    </SCButton>
  );
}
export function LikeButton({
  trackId, title, artistName, coverArt, liked, likesCount, size = "full",
}: { trackId: string; title: string; artistName?: string; coverArt?: string; liked: boolean; likesCount: number; size?: "compact" | "full" }) {
  
  const { toggleLike, likedTracks, loadingIds } = useLikeStore();
  
  // Safe comparison converting both to strings to avoid ID type mismatches
  const isCurrentlyLiked = likedTracks.some((t) => String(t.id) === String(trackId));
  const isLoading = loadingIds.includes(trackId);

  const handleToggle = () => {
    // IMPORTANT: Passing the full object so the Sidebar has data to display
    toggleLike({ 
      id: trackId, 
      title: title, 
      artistName: artistName, 
      coverArt: coverArt, 
      likesCount: likesCount 
    });
  };

  return (
    <SCButton active={isCurrentlyLiked} onClick={handleToggle} disabled={isLoading} label={isCurrentlyLiked ? "Unlike" : "Like"} count={likesCount}>
      {isCurrentlyLiked ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
    </SCButton>
  );
}

export function TrackActionButtons({
  trackId, title, artistName, coverArt, likesCount, liked, repostsCount, size = "full",
}: TrackActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <LikeButton 
        trackId={trackId} title={title} artistName={artistName} coverArt={coverArt}
        liked={liked} likesCount={likesCount} size={size} 
      />
      <RepostButton 
        trackId={trackId} 
        reposted={false} 
        repostsCount={repostsCount} 
        size={size} 
      />
      <SCButton label="Share"><RiShareForwardLine size={15} /></SCButton>
    </div>
  );
}