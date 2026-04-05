"use client";

import { MdQueueMusic, MdPlaylistAdd } from "react-icons/md";

interface TrackCardMenuProps {
    isOpen: boolean;
    onAddToNextUp: () => void;
    onAddToPlaylist: () => void;
}

export default function TrackCardMenu({
    isOpen,
    onAddToNextUp,
    onAddToPlaylist,
}: TrackCardMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-md border border-zinc-700 bg-[#111] py-2 shadow-2xl">
            <button
                onClick={onAddToNextUp}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 transition-colors"
            >
                <MdQueueMusic className="text-base" />
                <span>Add to Next Up</span>
            </button>

            <button
                onClick={onAddToPlaylist}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 transition-colors"
            >
                <MdPlaylistAdd className="text-base" />
                <span>Add to playlist</span>
            </button>
        </div>
    );
}