import { useState } from "react";
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
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Fixed: Now accepts the event
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
      className={`group flex items-center gap-1.5 h-7.5 px-2.5 rounded border transition-all duration-150 select-none
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
      repostsCount: repostsCount + (active ? -1 : 1), // Optimistically update count
      likesCount: 0,
      coverArtUrl: coverArt || null
    } as TrackData);
  };

  return (
    <SCButton active={active} onClick={handleToggle} disabled={isLoading} label={active ? "Undo Repost" : "Repost"} count={repostsCount} size={size}>
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
      likesCount: likesCount + (active ? -1 : 1), // Optimistically update count
      repostsCount: 0, 
      coverArtUrl: coverArt || null
    } as TrackData);
  };

  return (
    <SCButton active={active} onClick={handleToggle} disabled={isLoading} label={active ? "Unlike" : "Like"} count={likesCount} size={size}>
      {active ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
    </SCButton>
  );
}

export function TrackActionButtons({
  trackId, title, artistName, coverArt, likesCount, repostsCount, size = "full",
}: TrackActionButtonsProps) {
  const [modalType, setModalType] = useState<"likes" | "reposts" | null>(null);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <LikeButton 
          trackId={trackId} title={title} artistName={artistName} coverArt={coverArt}
          likesCount={likesCount} size={size} 
        />
        <span 
          onClick={(e) => { e.stopPropagation(); setModalType("likes"); }} 
          className="text-xs text-zinc-500 cursor-pointer hover:text-white hover:underline px-1"
        >
          {fmtCount(likesCount)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <RepostButton 
          trackId={trackId} title={title} artistName={artistName} coverArt={coverArt}
          repostsCount={repostsCount} size={size}
        />
        <span 
          onClick={(e) => { e.stopPropagation(); setModalType("reposts"); }} 
          className="text-xs text-zinc-500 cursor-pointer hover:text-white hover:underline px-1"
        >
          {fmtCount(repostsCount)}
        </span>
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