"use client";

import Image from "next/image";
import { FaPlay, FaPause, FaHeart } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import TrackCardMenu from "./TrackCardMenu";
import { usePlayerStore } from "@/src/store/playerStore";
import { useEffect, useRef, useState } from "react";

interface RecentlyPlayedItem {
    trackId: string;
    title: string;
    artist: string;
    coverArtUrl?: string | null;
    liked?: boolean;
    lastPlayedAt: string;
    lastPositionSeconds: number;
}

interface RecentlyPlayedCardProps {
    track: RecentlyPlayedItem;
}

const FALLBACK_IMAGE = "/images/track-placeholder.png";
const ACCENT = "#ff5500";

export default function RecentlyPlayedCard({ track }: RecentlyPlayedCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [liked, setLiked] = useState(track.liked ?? false);

    const { currentTrack, isPlaying, toggle, fetchAndPlay } = usePlayerStore();

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

    const handlePlayPause = () => {
        if (isCurrent) {
            toggle();
            return;
        }

        fetchAndPlay({
            trackId: track.trackId,
            title: track.title,
            cover: track.coverArtUrl || FALLBACK_IMAGE,
            artist: track.artist,
        });
    };

    return (
        <div className="group relative w-[190px] shrink-0 overflow-visible">
            <div className="relative h-[190px] w-[190px] overflow-hidden rounded-sm bg-zinc-900">
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
                >
                    {isCurrent && isPlaying ? (
                        <FaPause className="text-[2rem] text-black" />
                    ) : (
                        <FaPlay className="ml-1 text-[2rem] text-black" />
                    )}
                </button>

                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLiked((prev) => !prev);
                        }}
                        className="opacity-100 transition-opacity duration-200 hover:opacity-70"
                        aria-label={liked ? "Unlike track" : "Like track"}
                    >
                        <FaHeart
                            className="text-[1rem]"
                            style={{ color: liked ? ACCENT : "#111111" }}
                        />
                    </button>

                    <div ref={menuRef} className="relative">
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

            <p className="mt-2 line-clamp-1 text-[15px] font-semibold text-white">
                {track.title}
            </p>
        </div>
    );
}