import { useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiRepost } from "react-icons/bi";
import { RiShareForwardLine } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TrackActionButtonsProps {
  trackId: string;
  title: string;
  likesCount: number;
  liked: boolean;
  repostsCount: number;
  reposted: boolean;
  /** compact = icon only  |  full = icon + count label */
  size?: "compact" | "full";
}

// ─── Count formatter ──────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Shared button shell ──────────────────────────────────────────────────────
// Mimics the SoundCloud bordered square button

interface SCButtonProps {
  active?: boolean;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  count?: number;
  size?: "compact" | "full";
}

function SCButton({ active, onClick, label, children, count, size = "full" }: SCButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`
        group flex items-center gap-1.5 h-[30px] px-2.5 rounded
        border transition-all duration-150 select-none
        ${active
          ? "border-[#ff5500] bg-[#ff5500]/10 text-[#ff5500]"
          : "border-[#333] bg-transparent text-[#aaa] hover:border-[#555] hover:text-white"
        }
      `}
    >
      <span className={`flex items-center transition-transform duration-100 group-active:scale-90 ${active ? "text-[#ff5500]" : ""}`}>
        {children}
      </span>

      {/* Show count label only in "full" size and when count > 0 */}
      {size === "full" && typeof count === "number" && count > 0 && (
        <span className={`text-[11px] font-medium tabular-nums leading-none ${active ? "text-[#ff5500]" : "text-[#777] group-hover:text-[#aaa]"}`}>
          {fmtCount(count)}
        </span>
      )}
    </button>
  );
}

// ─── LikeButton ───────────────────────────────────────────────────────────────

export function LikeButton({
  liked,
  likesCount,
  size = "full",
}: Pick<TrackActionButtonsProps, "liked" | "likesCount"> & { size?: "compact" | "full" }) {
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount]     = useState(likesCount);

  const toggle = () => {
    setIsLiked((prev) => {
      setCount((c) => prev ? c - 1 : c + 1);
      return !prev;
    });
  };

  return (
    <SCButton active={isLiked} onClick={toggle} label={isLiked ? "Unlike" : "Like"} count={count} size={size}>
      {isLiked ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
    </SCButton>
  );
}

// ─── RepostButton ─────────────────────────────────────────────────────────────

export function RepostButton({
  reposted,
  repostsCount,
  size = "full",
}: Pick<TrackActionButtonsProps, "reposted" | "repostsCount"> & { size?: "compact" | "full" }) {
  const [isReposted, setIsReposted] = useState(reposted);
  const [count, setCount]           = useState(repostsCount);

  const toggle = () => {
    setIsReposted((prev) => {
      setCount((c) => prev ? c - 1 : c + 1);
      return !prev;
    });
  };

  return (
    <SCButton active={isReposted} onClick={toggle} label={isReposted ? "Remove repost" : "Repost"} count={count} size={size}>
      <BiRepost size={18} />
    </SCButton>
  );
}

// ─── ShareButton ──────────────────────────────────────────────────────────────

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

// ─── CopyLinkButton ───────────────────────────────────────────────────────────

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

// ─── TrackActionButtons (composite) ──────────────────────────────────────────
// Drop this into your TrackCard:
//   <TrackActionButtons trackId={track.trackId} title={track.title}
//     likesCount={track.likesCount} liked={track.liked}
//     repostsCount={track.repostsCount} reposted={track.reposted} />

export function TrackActionButtons({
  trackId, title, likesCount, liked, repostsCount, reposted, size = "full",
}: TrackActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5" data-track-id={trackId}>
      <LikeButton    liked={liked}       likesCount={likesCount}     size={size} />
      <RepostButton  reposted={reposted} repostsCount={repostsCount} size={size} />
      <ShareButton   title={title} />
      <CopyLinkButton />
    </div>
  );
}