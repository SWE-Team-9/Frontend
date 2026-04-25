"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Playlist } from "@/src/types/playlist";
import { usePlaylists } from "@/src/hooks/usePlaylists";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import {
  FaMusic,
  FaPlay,
  FaEllipsisH,
  FaListUl,
  FaTrash,
} from "react-icons/fa";

export function ProfilePlaylistCard({ playlist }: { playlist: Playlist }) {
  const { deletePlaylist } = usePlaylists();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const playlistUrl = `/library/playlists/${playlist.playlistId}`;
  const close = () => setMenuOpen(false);

  const handleAddToNextUp = () => {
    close();
    toast.success(`${playlist.title} was added to Next up.`);
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.playlistId);
      toast.success(`"${playlist.title}" was deleted.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete playlist");
    }
  };

  const item =
    "w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-zinc-800 transition-colors";

  return (
    <>
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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
              <FaMusic className="text-zinc-600 text-4xl" />
            </div>
          )}

          <Link href={playlistUrl} aria-label={playlist.title} className="absolute inset-0 z-10" />

          <div className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <div className="w-12 h-12 rounded-full bg-[#f50] flex items-center justify-center">
              <FaPlay className="text-white text-sm ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center"
              aria-label="More options"
            >
              <FaEllipsisH className="text-white text-[10px]" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={close} />
                <div className="absolute z-50 left-0 bottom-9 min-w-[180px] bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl overflow-hidden py-1">
                  <button type="button" onClick={handleAddToNextUp} className={item}>
                    <FaListUl size={11} className="text-white" /> Add to Next Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setConfirmOpen(true);
                    }}
                    className={`${item} text-red-400`}
                  >
                    <FaTrash size={11} /> Delete Playlist
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Link href={playlistUrl} className="block">
          <h3 className="text-white text-sm font-bold truncate hover:underline">
            {playlist.title}
          </h3>
          <p className="text-zinc-500 text-xs">
            {playlist.owner?.display_name ?? "You"}
          </p>
        </Link>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete playlist"
        message={`Are you sure you want to delete ${playlist.title}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}