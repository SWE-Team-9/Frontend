import { useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiRepost } from "react-icons/bi";
import { RiShareForwardLine } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";

// Import your store
import { useLikeStore } from '@/src/store/likeStore'; 

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TrackActionButtonsProps {
  trackId: string; // Coming from props as string
  title: string;
  likesCount: number;
  liked: boolean;
  repostsCount: number;
  reposted: boolean;
  size?: "compact" | "full";
}

// ─── Count formatter ──────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Shared button shell ──────────────────────────────────────────────────────

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
      aria-label={label}
      aria-pressed={active}
      className={`
        group flex items-center gap-1.5 h-[30px] px-2.5 rounded
        border transition-all duration-150 select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${active
          ? "border-[#ff5500] bg-[#ff5500]/10 text-[#ff5500]"
          : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"
        }
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

// ─── LikeButton (Wired to Store) ───────────────────────────────────────────────

export function LikeButton({
  trackId,
  title,
  liked,
  likesCount,
  size = "full",
}: { trackId: string; title: string; liked: boolean; likesCount: number; size?: "compact" | "full" }) {
  
  const { toggleLike, likedTracks, loadingIds } = useLikeStore();
  
  // 🛠️ SYNCED: Store uses strings for UI state tracking (loadingIds)
  const isCurrentlyLiked = likedTracks.some((t) => t.id === trackId);
  const isLoading = loadingIds.includes(trackId);

  const handleToggle = () => {
    // 🛠️ SYNCED: Pass the ID as a string. The store will handle the numeric conversion for the API.
    toggleLike({ 
      id: trackId, 
      title: title, 
      likesCount: likesCount 
    });
  };

  return (
    <SCButton 
      active={isCurrentlyLiked}
      onClick={handleToggle} 
      disabled={isLoading}
      label={isCurrentlyLiked ? "Unlike" : "Like"}
      count={likesCount} 
      
    >
      {isCurrentlyLiked ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
    </SCButton>
  );
}

// ─── RepostButton (Static for now) ───────────────────────────────────────────

export function RepostButton({
  repostsCount,
  size = "full",
}: { repostsCount: number; size?: "compact" | "full" }) {
  return (
    <SCButton label="Repost" count={repostsCount} size={size}>
      <BiRepost size={18} />
    </SCButton>
  );
}

// ─── Share & Copy Link Buttons ───────────────────────────────────────────────

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <SCButton active={copied} onClick={handleShare} label="Share">
      <RiShareForwardLine size={15} />
    </SCButton>
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <SCButton active={copied} onClick={handleCopy} label={copied ? "Copied!" : "Copy link"}>
      <IoCopyOutline size={14} />
    </SCButton>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TrackActionButtons({
  trackId, title, likesCount, liked, repostsCount, size = "full",
}: TrackActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5" data-track-id={trackId}>
      <LikeButton 
        trackId={trackId} 
        title={title}
        liked={liked} 
        likesCount={likesCount} 
        size={size} 
      />
      <RepostButton 
        repostsCount={repostsCount} 
        size={size} 
      />
      <ShareButton title={title} />
      <CopyLinkButton />
    </div>
  );
}