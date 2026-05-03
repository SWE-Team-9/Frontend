"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Playlist } from "@/src/types/playlist";
import { playlistsApi } from "@/src/services/playlistsService";
import {
  FaMusic,
  FaPlay,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";

interface ProfilePlaylistCardProps {
  playlist: Playlist;
  isOwner?: boolean;
}

export function ProfilePlaylistCard({ playlist, isOwner = false }: ProfilePlaylistCardProps) {
  // Like state
  const [liked, setLiked] = useState(playlist.liked ?? false);
  const [likesCount, setLikesCount] = useState(playlist.likesCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  const playlistUrl = `/library/playlists/${playlist.playlistId}`;

  const updateLocalLiked = (nextLiked: boolean) => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("likedPlaylistIds");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const ids = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
      const id = String(playlist.playlistId);
      if (nextLiked) ids.add(id);
      else ids.delete(id);
      window.localStorage.setItem(
        "likedPlaylistIds",
        JSON.stringify(Array.from(ids))
      );
    } catch {
      // Ignore storage errors to avoid breaking the UI.
    }
  };

  const handleLike = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isLiking || isOwner) return; // Prevent owner from liking their own playlist

    const wasLiked = liked;
    const prevCount = likesCount;

    const nextLiked = !wasLiked;
    setLiked(nextLiked);
    setLikesCount((c: number) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    setIsLiking(true);
    updateLocalLiked(nextLiked);

    try {
      if (wasLiked) {
        await playlistsApi.unlikePlaylist(playlist.playlistId);
      } else {
        await playlistsApi.likePlaylist(playlist.playlistId);
      }
    } catch (error) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 409) {
        // Server already has the desired state; keep optimistic UI.
        return;
      }
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(prevCount);
      updateLocalLiked(wasLiked);
      toast.error(
        err instanceof Error ? err.message : "Could not update like"
      );
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="group relative">
      <div className="relative aspect-square rounded-md overflow-hidden bg-[#222] mb-2">
        {playlist.cover ? (
          <Image
            src={playlist.cover}
            alt={playlist.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#333] to-[#1a1a1a]">
            <FaMusic className="text-zinc-600 text-4xl" />
          </div>
        )}

        <Link href={playlistUrl} aria-label={playlist.title} className="absolute inset-0 z-10" />

        <div className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <FaPlay className="text-black text-sm ml-0.5" />
          </div>
        </div>

        {/* LIKE BUTTON - Only show for non-owners */}
        {!isOwner && (
          <div className="absolute bottom-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              aria-label={liked ? "Unlike playlist" : "Like playlist"}
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {liked ? (
                <FaHeart className="text-[#f50] text-[1rem]" />
              ) : (
                <FaRegHeart className="text-white text-[1rem]" />
              )}
            </button>
          </div>
        )}
      </div>

      <Link href={playlistUrl} className="block">
        <h3 className="text-white text-sm font-bold truncate hover:text-neutral-600 transition-colors">
          {playlist.title}
        </h3>
        <p className="text-zinc-500 text-xs">
          {playlist.owner?.display_name ?? "You"}
        </p>
      </Link>
    </div>
  );
}