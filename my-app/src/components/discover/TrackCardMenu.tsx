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
        <div className="absolute bottom-12 right-0 z-30 w-56 overflow-hidden rounded-md border border-zinc-700 bg-[#111111] shadow-2xl">
            <button
                onClick={onAddToNextUp}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left text-white transition hover:bg-zinc-800"
            >
                <MdQueueMusic className="text-lg text-white transition group-hover:text-[#8c8c8c]" />
                <span className="text-sm font-medium transition group-hover:text-[#8c8c8c]">
                    Add to Next Up
                </span>
            </button>

            <button
                onClick={onAddToPlaylist}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left text-white transition hover:bg-zinc-800"
            >
                <MdPlaylistAdd className="text-lg text-white transition group-hover:text-[#8c8c8c]" />
                <span className="text-sm font-medium transition group-hover:text-[#8c8c8c]">
                    Add to playlist
                </span>
            </button>
        </div>
    );
}