"use client";

import Image from "next/image";
import { FaPlay, FaPause, FaHeart } from "react-icons/fa";
import { MdQueueMusic } from "react-icons/md";
import { BiRepost } from "react-icons/bi";
import { FiShare } from "react-icons/fi";
import { TbCopy } from "react-icons/tb";
import { usePlayerStore } from "@/src/store/playerStore";
import { ListeningHistoryItem } from "@/src/types/history";
import { useState } from "react";
import { useLikeStore } from "@/src/store/likeStore";
import { useRepostStore } from "@/src/store/repostStore";
import { TrackData } from "@/src/types/interactions";
import TimestampedCommentsSection from "@/src/components/tracks/TimestampedCommentsSection";
import SharePopup from "@/src/components/share/SharePopup";
import { buildFullShareUrl, buildTrackPermalink } from "@/src/lib/permalinks";
import { TrackPageLink, UserProfileLink } from "@/src/components/navigation/EntityLinks";

const FALLBACK_IMAGE = "/images/track-placeholder.png";
const ACCENT = "#ff5500";

interface HistoryTrackRowProps {
  track: ListeningHistoryItem;
  contextTrackIds?: string[];
}

function formatTime(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function HistoryTrackRow({ track, contextTrackIds }: HistoryTrackRowProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [likeError, setLikeError] = useState<string | null>(null);

  const trackHref = buildTrackPermalink({
    trackId: track.trackId,
    artistHandle: track.artistHandle,
    slug: track.slug,
  });
  const fullTrackUrl = buildFullShareUrl(trackHref);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullTrackUrl);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }

    setTimeout(() => setCopyStatus("idle"), 1500);
  };

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    seekTo,
    playTrackFromContext,
  } = usePlayerStore();

  const { toggleLike, isLiked, loadingIds } = useLikeStore();

  const currentlyLiked = isLiked(track.trackId);
  const isLikeLoading = loadingIds.includes(String(track.trackId));

  const baselineLiked = track.liked ?? false;
  const baselineLikes = track.likesCount ?? 0;

  const displayLikes =
    currentlyLiked && !baselineLiked
      ? baselineLikes + 1
      : !currentlyLiked && baselineLiked
        ? Math.max(0, baselineLikes - 1)
        : baselineLikes;

  const { toggleRepost, isReposted, loadingIds: repostLoadingIds } = useRepostStore();

  const currentlyReposted = isReposted(track.trackId);
  const isRepostLoading = repostLoadingIds.includes(String(track.trackId));

  const baselineReposted = track.reposted ?? false;
  const baselineReposts = track.repostsCount ?? 0;

  const displayReposts =
    currentlyReposted && !baselineReposted
      ? baselineReposts + 1
      : !currentlyReposted && baselineReposted
        ? Math.max(0, baselineReposts - 1)
        : baselineReposts;

  const handleRepostToggle = async () => {
    await toggleRepost({
      id: track.trackId,
      title: track.title,
      artistName: track.artist,
      artistId: track.artistId,
      artistHandle: track.artistHandle,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
      likesCount: baselineLikes,
      repostsCount: baselineReposts,
      coverArtUrl: track.coverArtUrl || null,
      coverArt: track.coverArtUrl || null,
      imageUrl: track.coverArtUrl || null,
    } as TrackData);
  };

  const isCurrent = currentTrack?.trackId === track.trackId;
  const waveformProgress =
    isCurrent && duration > 0 ? currentTime / duration : 0;

  const handlePlay = async () => {
    const playerTrack = {
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      artistId: track.artistId,
      artistHandle: track.artistHandle,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
      cover: track.coverArtUrl || FALLBACK_IMAGE,
      duration: track.durationSeconds,
    };

    await playTrackFromContext({
      track: playerTrack,
      contextTrackIds,
    });
  };

  const addTrackToNextUp = usePlayerStore((s) => s.addTrackToNextUp);

  const handleWaveformSeek = async (progress: number) => {
    if (!isCurrent || duration <= 0) return;

    const nextTime = progress * duration;
    await seekTo(nextTime);
  };


  return (
    <div className="mb-10 flex gap-5">
      <div className="relative h-37.5 w-37.5 shrink-0 overflow-hidden rounded-sm bg-zinc-900">
        <Image
          src={track.coverArtUrl || FALLBACK_IMAGE}
          alt={track.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-start gap-4">
          <button
            onClick={handlePlay}
            className="mt-1 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-opacity hover:scale-105 hover:opacity-90 active:scale-95"
          >
            {isCurrent && isPlaying ? (
              <FaPause className="text-xl" />
            ) : (
              <FaPlay className="ml-1 text-xl" />
            )}
          </button>

          <div className="min-w-0">
            <UserProfileLink
              handle={track.artistHandle}
              className="block truncate text-[15px] text-zinc-400 hover:text-white transition-colors"
            >
              {track.artist}
            </UserProfileLink>

            <TrackPageLink
              trackId={track.trackId}
              artistHandle={track.artistHandle}
              slug={track.slug}
              className="block truncate text-[22px] font-bold leading-tight text-white hover:text-zinc-600 transition-colors"
            >
              {track.title}
            </TrackPageLink>
          </div>
        </div>

        <div className="mb-5 w-full">
          <TimestampedCommentsSection
            trackId={track.trackId}
            trackTitle={track.title}
            trackOwnerId={track.artistId}
            durationSeconds={track.durationSeconds ?? 0}
            waveformData={track.waveformData ?? null}
            waveformSeed={track.trackId}
            waveformProgress={waveformProgress}
            onSeek={isCurrent ? handleWaveformSeek : undefined}
            currentPlaybackSeconds={isCurrent ? currentTime : 0}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {likeError && (
            <div className="w-full rounded border border-red-700 bg-red-900/40 px-3 py-1 text-xs text-red-300">
              {likeError}
            </div>
          )}
          {/* Like */}
          <button
            onClick={async () => {
              setLikeError(null);
              useLikeStore.getState().clearError();
              await toggleLike({
                id: track.trackId,
                title: track.title,
                artistName: track.artist,
                artistId: track.artistId,
                artistHandle: track.artistHandle,
                artistAvatarUrl: track.artistAvatarUrl ?? null,
                likesCount: baselineLikes,
                repostsCount: 0,
                coverArtUrl: track.coverArtUrl || null,
                coverArt: track.coverArtUrl || null,
                imageUrl: track.coverArtUrl || null,
              } as TrackData);
              const storeErr = useLikeStore.getState().error;
              if (storeErr) {
                setLikeError(storeErr);
                setTimeout(() => setLikeError(null), 3000);
              }
            }}
            disabled={isLikeLoading}
            title={currentlyLiked ? "Unlike" : "Like"}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaHeart
              className="text-base transition"
              style={{ color: currentlyLiked ? ACCENT : "#a1a1aa" }}
            />
            <span
              className="min-w-[1.5ch] tabular-nums"
              style={{ color: currentlyLiked ? ACCENT : "#e4e4e7" }}
            >
              {displayLikes}
            </span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepostToggle}
            disabled={isRepostLoading}
            title={currentlyReposted ? "Undo repost" : "Repost"}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BiRepost
              className="text-xl transition"
              style={{ color: currentlyReposted ? ACCENT : "#a1a1aa" }}
            />
            <span
              className="min-w-[1.5ch] tabular-nums"
              style={{ color: currentlyReposted ? ACCENT : "#e4e4e7" }}
            >
              {displayReposts}
            </span>
          </button>

          {/* Duration */}
          <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm tabular-nums text-zinc-400">
            {formatTime(track.durationSeconds)}
          </span>

          {/* Share */}
          <div className="relative">
            <button
              onClick={() => setShareOpen((v) => !v)}
              title="Share"
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-700"
            >
              <FiShare className="text-base" />
              <span>Share</span>
            </button>

            {shareOpen && (
              <SharePopup
                permalink={trackHref}
                resourceType="TRACK"
                resourceId={track.trackId}
                resourceTitle={track.title}
                resourceCoverArtUrl={track.coverArtUrl || null}
                onClose={() => setShareOpen(false)}
              />
            )}
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            title={
              copyStatus === "success"
                ? "Copied!"
                : copyStatus === "error"
                  ? "Copy failed"
                  : "Copy link"
            }
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${copyStatus === "success"
                ? "border-green-600 bg-green-800/60 text-green-300"
                : copyStatus === "error"
                  ? "border-red-600 bg-red-800/60 text-red-300"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700"
              }`}
          >
            <TbCopy className="text-base" />
            <span>
              {copyStatus === "success"
                ? "Copied!"
                : copyStatus === "error"
                  ? "Failed"
                  : "Copy link"}
            </span>
          </button>

          {/* Add to next up */}
          <button
            onClick={async () => {
              await addTrackToNextUp(track.trackId);
            }}
            title="Add to Next Up"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-700"
          >
            <MdQueueMusic className="text-base" />
            <span>Next Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}