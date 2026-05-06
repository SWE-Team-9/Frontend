"use client";

import { MdQueueMusic, MdPlaylistAdd } from "react-icons/md";

interface TrackCardMenuProps {
  isOpen: boolean;
  onAddToNextUp: () => void | Promise<void>;
  onAddToPlaylist: () => void | Promise<void>;
  disabled?: boolean;
}

export default function TrackCardMenu({
  isOpen,
  onAddToNextUp,
  onAddToPlaylist,
  disabled = false,
}: TrackCardMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-md border border-zinc-700 bg-[#111] py-2 shadow-2xl">
      <button
        type="button"
        disabled={disabled}
        onClick={onAddToNextUp}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MdQueueMusic className="text-base" />
        <span>Add to Next Up</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onAddToPlaylist}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MdPlaylistAdd className="text-base" />
        <span>Add to playlist</span>
      </button>
    </div>
  );
}