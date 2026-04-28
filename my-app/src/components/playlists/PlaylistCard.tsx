"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playlist } from "@/src/types/playlist";
import { usePlaylists } from "@/src/hooks/usePlaylists";

import { EmbedModal } from "./EmbedModal";
import { toast } from "sonner";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { EditPlaylistModal } from "@/src/components/playlists/EditPlaylistModal";
import { SharePlaylistModal } from "@/src/components/playlists/SharePlaylistModal";

import {
  FaMusic,
  FaPlay,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaTrash,
  FaCopy,
  FaShareSquare,
  FaPen,
  FaLink,
  FaListUl,
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

  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const playlistUrl = `/library/playlists/${playlist.playlistId}`;

  const handleLike = () => setLiked((v) => !v);
  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  // COPY LINK (FIXED)
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

  // ADD TO NEXT UP
  const handleAddToNextUp = () => {
    closeMenu();
    toast.success(`${playlist.title} was added to Next up.`);
  };

  // DELETE
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
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
          <div className="w-12 h-12 rounded-full bg-[#f50] flex items-center justify-center">
            <FaPlay className="text-white text-sm ml-0.5" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleLike}
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center"
          >
            {liked ? (
              <FaHeart className="text-[#f50] text-xs" />
            ) : (
              <FaRegHeart className="text-white text-xs" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleMenu}
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center"
          >
            <FaEllipsisH className="text-white text-[10px]" />
          </button>
        </div>

        {/* MENU */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />

            <div className="absolute z-50 left-2 bottom-11 min-w-[180px] bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl overflow-hidden py-1">

              {variant === "library" && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
                >
                  <FaLink size={11} className="text-zinc-400" />
                  Copy Link
                </button>
              )}

              <button
                type="button"
                onClick={handleLike}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                {liked ? (
                  <FaHeart size={11} className="text-[#f50]" />
                ) : (
                  <FaRegHeart size={11} className="text-zinc-400" />
                )}
                Like
              </button>

              <button
                type="button"
                onClick={handleAddToNextUp}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-white hover:bg-zinc-800"
              >
                <FaListUl size={11} className="text-zinc-400" />
                Add to Next Up
              </button>

              <div className="my-1 h-px bg-zinc-800" />

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setConfirmOpen(true);
                }}
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
      <SharePlaylistModal
        playlist={playlist}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <EditPlaylistModal
        playlist={playlist}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          toast.success("Playlist updated");
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