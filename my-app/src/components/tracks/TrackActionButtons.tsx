"use client";

import React, { useState, useRef, useEffect } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiRepost } from "react-icons/bi";
import { RiShareForwardLine } from "react-icons/ri";
import { EngagementModal } from "@/src/components/profile/modals/EngagementModal";
import { useLikeStore } from '@/src/store/likeStore'; 
import { useRepostStore } from '@/src/store/repostStore';
import { TrackData } from "@/src/types/interactions";

export interface TrackActionButtonsProps {
  trackId: string;
  title: string;
  artistName: string;
  coverArt?: string;
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
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; 
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function SCButton({ active, onClick, label, children, disabled }: SCButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-1.5 h-7.5 px-2.5 rounded border transition-all duration-150 select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${active ? "border-[#ff5500] bg-[#ff5500]/10 text-[#ff5500]" : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"}
      `}
    >
      <span className={`flex items-center transition-transform duration-100 group-active:scale-90 ${active ? "text-[#ff5500]" : ""}`}>
        {children}
      </span>
    </button>
  );
}

export function RepostButton({
  trackId, title, artistName, coverArt, repostsCount, size = "full",
}: { trackId: string; title: string; artistName: string; coverArt?: string; repostsCount: number; size?: "compact" | "full"; }) {
  const { toggleRepost, isReposted, loadingIds } = useRepostStore();
  const active = isReposted(trackId);
  const isLoading = loadingIds.includes(String(trackId));

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    await toggleRepost({
      id: trackId,
      title,
      artistName,
      coverArt,
      repostsCount: repostsCount, 
      likesCount: 0,
      coverArtUrl: coverArt || null
    } as TrackData);
  };

  return (
    <SCButton active={active} onClick={handleToggle} disabled={isLoading} label={active ? "Undo Repost" : "Repost"}>
      <BiRepost size={18} />
    </SCButton>
  );
}

export function LikeButton({
  trackId, title, artistName, coverArt, likesCount, size = "full",
}: { trackId: string; title: string; artistName: string; coverArt?: string; likesCount: number; size?: "compact" | "full" }) {
  const { toggleLike, isLiked, loadingIds } = useLikeStore();
  const active = isLiked(trackId);
  const isLoading = loadingIds.includes(String(trackId));

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleLike({ 
      id: trackId, 
      title, 
      artistName, 
      coverArt, 
      likesCount: likesCount, 
      repostsCount: 0, 
      coverArtUrl: coverArt || null
    } as TrackData);
  };

  return (
    <SCButton active={active} onClick={handleToggle} disabled={isLoading} label={active ? "Unlike" : "Like"}>
      {active ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
    </SCButton>
  );
}

export function TrackActionButtons({
  trackId, title, artistName, coverArt, likesCount:initialLikes, repostsCount, liked, reposted, size = "full",
}: TrackActionButtonsProps) {
  const [modalType, setModalType] = useState<"likes" | "reposts" | null>(null);

  // 1. Get the LIVE status from stores
  const likedTrack = useLikeStore((state) => 
    state.likedTracks.find((t) => String(t.id) === String(trackId))
  );
  const repostedTrack = useRepostStore((state) => 
    state.repostedTracks.find((t) => String(t.id) === String(trackId))
  );

  // Use the count from the store if it exists, otherwise we'd need the initial prop
  // (In a full store-managed app, you'd usually sync the feed into the store on load)
  const isCurrentlyLiked = !!likedTrack;
  const isCurrentlyReposted = !!repostedTrack;

  const displayLikes = isCurrentlyLiked 
    ? (likedTrack?.likesCount ?? initialLikes) 
    : (liked ? Math.max(0, initialLikes - 1) : initialLikes);

  const displayReposts = isCurrentlyReposted 
    ? (repostedTrack?.repostsCount ?? repostsCount) 
    : (reposted ? Math.max(0, repostsCount - 1) : repostsCount);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <LikeButton 
          trackId={trackId} title={title} artistName={artistName} coverArt={coverArt}
          likesCount={displayLikes}
        />
        {displayLikes > 0 && (
          <span 
            onClick={(e) => { e.stopPropagation(); setModalType("likes"); }} 
            className="text-[11px] text-zinc-500 cursor-pointer hover:text-white hover:underline px-1 tabular-nums"
          >
            {fmtCount(displayLikes)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <RepostButton 
          trackId={trackId} title={title} artistName={artistName} coverArt={coverArt}
          repostsCount={displayReposts} 
        />
        {displayReposts > 0 && (
          <span 
            onClick={(e) => { e.stopPropagation(); setModalType("reposts"); }} 
            className="text-[11px] text-zinc-500 cursor-pointer hover:text-white hover:underline px-1 tabular-nums"
          >
            {fmtCount(displayReposts)}
          </span>
        )}
      </div>

      <SCButton label="Share"><RiShareForwardLine size={15} /></SCButton>
      
      {modalType && (
        <EngagementModal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          trackId={trackId} 
          type={modalType} 
        />
      )}
    </div>
  );
}