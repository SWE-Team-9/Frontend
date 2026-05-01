"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useLikeStore } from "@/src/store/likeStore";
import { TrackData } from "@/src/types/interactions";
import Image from "next/image";
import { TrackPageLink, UserProfileLink } from "@/src/components/navigation/EntityLinks";

export function TrackInfo() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const accessState = usePlayerStore((s) => s.accessState);
  const isPlayingAd = usePlayerStore((s) => s.isPlayingAd);
  const currentAd = usePlayerStore((s) => s.currentAd);
  const { toggleLike, isLiked, loadingIds } = useLikeStore();

  if (!currentTrack) return null;

  // - Ad mode: render like a track but with AD badge and no like button ──
  if (isPlayingAd && currentAd) {
    return (
      <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
        {/* Ad artwork placeholder */}
        <div className="w-12 h-12 rounded shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center shadow-lg">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">AD</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate leading-tight">
            {currentAd.title}
          </p>
          <p className="text-[#999] text-xs truncate mt-0.5">Advertisement</p>
        </div>
        {currentAd.clickUrl && (
          <a
            href={currentAd.clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors"
          >
            Learn more
          </a>
        )}
      </div>
    );
  }

  const liked = isLiked(currentTrack.trackId);
  const isLikeLoading = loadingIds.includes(String(currentTrack.trackId));

  const getArtistLabel = (value: unknown): string => {
    if (typeof value === "string") return value;

    if (
      value &&
      typeof value === "object" &&
      "displayName" in value &&
      typeof (value as { displayName?: unknown }).displayName === "string"
    ) {
      return (value as { displayName: string }).displayName;
    }

    return "Unknown Artist";
  };

  const artistLabel = getArtistLabel(currentTrack.artist);

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
      <Image
        src={currentTrack.cover}
        alt={currentTrack.title}
        width={48}
        height={48}
        className="rounded object-cover shadow-lg shrink-0"
        unoptimized
      />
      <div className="min-w-0 flex-1">
        <TrackPageLink
          trackId={currentTrack.trackId}
          artistHandle={currentTrack.artistHandle}
          className="block truncate text-sm font-medium leading-tight text-white hover:underline"
        >
          {currentTrack.title}
        </TrackPageLink>

        <UserProfileLink
          handle={currentTrack.artistHandle}
          className="mt-0.5 block truncate text-xs text-[#999] hover:text-white hover:underline"
        >
          {artistLabel}
        </UserProfileLink>

        {accessState === "PREVIEW" && (
          <span className="text-[10px] text-[#f50] font-bold uppercase">
            Preview
          </span>
        )}
      </div>

      <button
        onClick={async () => {
          await toggleLike({
            id: currentTrack.trackId,
            title: currentTrack.title,
            artistName: artistLabel,
            artistId: currentTrack.artistId,
            artistHandle: currentTrack.artistHandle,
            artistAvatarUrl: currentTrack.artistAvatarUrl ?? null,
            likesCount: 0,
            repostsCount: 0,
            coverArtUrl: currentTrack.cover || null,
            coverArt: currentTrack.cover || null,
            imageUrl: currentTrack.cover || null,
          } as TrackData);
        }}
        disabled={isLikeLoading}
        className={`shrink-0 p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${liked ? "text-[#f50]" : "text-[#999] hover:text-white"
          }`}
      >
        {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
      </button>
    </div>
  );
}