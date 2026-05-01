"use client";

import Image from "next/image";
import { FaPlay, FaPause, FaHeart } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import TrackCardMenu from "./TrackCardMenu";
import { usePlayerStore } from "@/src/store/playerStore";
import { useEffect, useRef, useState } from "react";
import { useLikeStore } from "@/src/store/likeStore";
import { TrackData } from "@/src/types/interactions";
import { loadQueue } from "@/src/services/playerService";
import { TrackPageLink, UserProfileLink } from "@/src/components/navigation/EntityLinks";

export interface DiscoverCardTrack {
  trackId: string;
  title: string;
  slug?: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  liked?: boolean;
  likesCount?: number;
  reposted?: boolean;
  repostsCount?: number;
  durationMs?: number;
  durationSeconds?: number;
  waveformData?: number[] | null;
}

interface RecentlyPlayedCardProps {
  track: DiscoverCardTrack;
  contextTrackIds?: string[];
}

const FALLBACK_IMAGE = "/images/track-placeholder.png";
const ACCENT = "#ff5500";

export default function RecentlyPlayedCard({
  track,
  contextTrackIds,
}: RecentlyPlayedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { currentTrack, isPlaying, toggle, fetchAndPlay } = usePlayerStore();
  const { toggleLike, isLiked, loadingIds } = useLikeStore();

  const liked = isLiked(track.trackId) || track.liked === true;
  const isLikeLoading = loadingIds.includes(String(track.trackId));
  const isCurrent = currentTrack?.trackId === track.trackId;

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handlePlayPause = async () => {
    if (isCurrent) {
      toggle();
      return;
    }

    const playerTrack = {
      trackId: track.trackId,
      title: track.title,
      cover: track.coverArtUrl || FALLBACK_IMAGE,
      artist: track.artist,
      artistId: track.artistId,
      artistHandle: track.artistHandle,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
    };

    if (contextTrackIds && contextTrackIds.length > 1) {
      try {
        const resp = await loadQueue({
          contextType: "CONTEXT_IDS",
          trackIds: contextTrackIds,
          startTrackId: track.trackId,
        });

        usePlayerStore.setState({
          currentQueueIndex: resp.currentIndex,
          queueLength: resp.queueLength,
          tracksUntilAd: resp.tracksUntilAd,
          currentAd: null,
          isPlayingAd: false,
          queueVersion: usePlayerStore.getState().queueVersion + 1,
        });

        await fetchAndPlay(playerTrack, true);
      } catch {
        await fetchAndPlay(playerTrack);
      }
    } else {
      await fetchAndPlay(playerTrack);
    }
  };

  return (
    <div className="group relative w-47.5 shrink-0 overflow-visible">
      <div className="relative h-47.5 w-47.5 overflow-hidden rounded-sm bg-zinc-900">
        <Image
          src={track.coverArtUrl || FALLBACK_IMAGE}
          alt={track.title}
          fill
          className="object-cover"
          unoptimized
        />

        <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/15" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 hover:opacity-80"
          aria-label={isCurrent && isPlaying ? "Pause track" : "Play track"}
        >
          {isCurrent && isPlaying ? (
            <FaPause className="text-[2rem] text-black" />
          ) : (
            <FaPlay className="ml-1 text-[2rem] text-black" />
          )}
        </button>

        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await toggleLike({
                id: track.trackId,
                title: track.title,
                artistName: track.artist,
                artistId: track.artistId,
                artistHandle: track.artistHandle,
                artistAvatarUrl: track.artistAvatarUrl ?? null,
                repostsCount: 0,
                likesCount: track.likesCount ?? 0,
                coverArtUrl: track.coverArtUrl || null,
                coverArt: track.coverArtUrl || null,
                imageUrl: track.coverArtUrl || null,
              } as TrackData);
            }}
            disabled={isLikeLoading}
            className="opacity-100 transition-opacity duration-200 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={liked ? "Unlike track" : "Like track"}
          >
            <FaHeart
              className="text-[1rem]"
              style={{ color: liked ? ACCENT : "#111111" }}
            />
          </button>

          <div ref={menuRef} className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="opacity-100 transition-opacity duration-200 hover:opacity-70"
              aria-label="Open track menu"
            >
              <HiDotsHorizontal
                className="text-[1.2rem]"
                style={{ color: menuOpen ? ACCENT : "#111111" }}
              />
            </button>

            <TrackCardMenu
              isOpen={menuOpen}
              onAddToNextUp={() => {
                console.log("Add to Next Up", track);
                setMenuOpen(false);
              }}
              onAddToPlaylist={() => {
                console.log("Add to playlist", track);
                setMenuOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      <TrackPageLink
        trackId={track.trackId}
        artistHandle={track.artistHandle}
        className="mt-2 block line-clamp-1 text-[15px] font-semibold text-white hover:underline"
      >
        {track.title}
      </TrackPageLink>

      <UserProfileLink
        handle={track.artistHandle}
        className="block line-clamp-1 text-[14px] font-medium text-zinc-400 hover:text-white hover:underline"
      >
        {track.artist}
      </UserProfileLink>
    </div>
  );
}