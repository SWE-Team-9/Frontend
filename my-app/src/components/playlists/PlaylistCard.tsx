"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playlist } from "@/src/types/playlist";
import { usePlaylists } from "@/src/hooks/usePlaylists";
import { playlistsApi } from "@/src/services/playlistsService";
import SharePopup from "@/src/components/share/SharePopup";
import { EmbedModal } from "./EmbedModal";
import { toast } from "sonner";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { EditPlaylistModal } from "@/src/components/playlists/EditPlaylistModal";

import {
  FaMusic,
  FaPlay,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaTrash,
  FaLink,
  FaListUl,
  FaShare,
  FaEdit,
  FaCode,
} from "react-icons/fa";

type Variant = "library" | "profile";

export function PlaylistCard({
  playlist,
  variant = "library",
}: {
  playlist: Playlist;
  variant?: Variant;
}) {
  const { deletePlaylist } = usePlaylists();

  // Read initial liked state from the playlist data
  const [liked, setLiked] = useState(playlist.liked ?? false);
  const [likesCount, setLikesCount] = useState(playlist.likesCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const playlistUrl = `/library/playlists/${playlist.playlistId}`;

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  const handleLike = async (e?: React.MouseEvent) => {
    e?.preventDefault(); 
    if (isLiking) return;

    const wasLiked = liked;
    const prevCount = likesCount;

    setLiked(!wasLiked);
    setLikesCount((c:number) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    setIsLiking(true);

    try {
      if (wasLiked) {
        await playlistsApi.unlikePlaylist(playlist.playlistId); 
      } else {
        await playlistsApi.likePlaylist(playlist.playlistId);  
      }
    } catch (err) {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(prevCount);
      toast.error(err instanceof Error ? err.message : "Could not update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${playlistUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link has been copied to the clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
    closeMenu();
  };

  const handleAddToNextUp = () => {
    closeMenu();
    toast.success(`${playlist.title} was added to Next up.`);
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.playlistId);
      toast.success(`"${playlist.title}" was deleted.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete playlist"
      );
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="group relative">
      {/* COVER */}
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

        {/* LINK OVERLAY */}
        <Link
          href={playlistUrl}
          aria-label={playlist.title}
          className="absolute inset-0 z-10"
        />

        {/* PLAY ICON */}
        <div className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <FaPlay className="text-black text-[2rem] ml-1" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            aria-label={liked ? "Unlike playlist" : "Like playlist"}
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center disabled:opacity-50"
          >
            {liked ? (
              <FaHeart className="text-[#f50] text-[1rem]" />
            ) : (
              <FaRegHeart className="text-white text-[1rem]" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleMenu(); }}
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center"
          >
            <FaEllipsisH className="text-white text-[10px]" />
          </button>
        </div>

        {/* DROPDOWN MENU */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute z-50 left-2 bottom-11 min-w-47.5 bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl overflow-hidden py-1">

              <button
                type="button"
                onClick={handleAddToNextUp}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                <FaListUl size={11} className="text-zinc-400" />
                Add to Next Up
              </button>

              <button
                type="button"
                onClick={() => { closeMenu(); setEditOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                <FaEdit size={11} className="text-zinc-400" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => { closeMenu(); setEmbedOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                <FaCode size={11} className="text-zinc-400" />
                Embed
              </button>

              <div className="my-1 h-px bg-zinc-800" />

              <button
                type="button"
                onClick={() => { closeMenu(); setConfirmOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                <FaTrash size={11} className="text-zinc-400" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* TITLE */}
      <Link href={playlistUrl} className="block">
        <h3 className="text-white text-sm font-bold truncate hover:underline">
          {playlist.title}
        </h3>
        <p className="text-zinc-500 text-xs">
          {playlist.owner?.display_name ?? "You"}
        </p>
      </Link>

      {/* MODALS */}
      {shareOpen && (
        <SharePopup
          permalink={playlistUrl}
          onClose={() => setShareOpen(false)}
          resourceType="PLAYLIST"
          resourceId={playlist.playlistId}
          resourceTitle={playlist.title}
          resourceCoverArtUrl={playlist.cover ?? null}
        />
      )}

      <EditPlaylistModal
        playlist={playlist}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          toast.success("Playlist updated");
          void updated;
        }}
      />

      <EmbedModal
        playlistId={playlist.playlistId}
        isOpen={embedOpen}
        onClose={() => setEmbedOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete playlist"
        message={`Are you sure you want to delete "${playlist.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}