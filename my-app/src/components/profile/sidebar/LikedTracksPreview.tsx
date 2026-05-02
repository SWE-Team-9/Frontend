"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { getUserLikes } from "@/src/services/likeService";
import { TrackData } from "@/src/types/interactions";

interface LikedTracksPreviewProps {
    userId: string;
}

const FALLBACK_IMAGE = "/images/track-placeholder.png";
const PREVIEW_LIMIT = 3;

export default function LikedTracksPreview({ userId }: LikedTracksPreviewProps) {
    const [likes, setLikes] = useState<TrackData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;

        let isMounted = true;

        const fetchLikes = async () => {
            try {
                setLoading(true);
                const data = await getUserLikes(userId, 1, PREVIEW_LIMIT);

                if (!isMounted) return;
                setLikes(data);
            } catch (err) {
                console.error("Failed to fetch sidebar likes:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLikes();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                <p className="font-bold uppercase">Your Likes</p>

                <Link
                    href="/library/likes"
                    className="hover:text-white transition-colors font-bold uppercase"
                >
                    View all
                </Link>
            </div>

            {loading ? (
                <p className="text-xs text-zinc-600 font-bold uppercase animate-pulse">
                    Loading likes...
                </p>
            ) : likes.length === 0 ? (
                <p className="text-xs text-zinc-600 font-bold uppercase">
                    No liked tracks yet
                </p>
            ) : (
                likes.map((track) => {
                    const cover =
                        track.coverArt || track.coverArtUrl || track.imageUrl || FALLBACK_IMAGE;

                    return (
                        <div
                            key={track.id}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all"
                        >
                            <Link
                                href={`/tracks/${track.trackId ?? track.id}`}
                                className="w-10 h-10 bg-zinc-800 rounded relative overflow-hidden shrink-0"
                            >
                                <Image
                                    src={cover}
                                    alt={track.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </Link>

                            <div className="min-w-0 flex-1">
                                <Link
                                    href={`/tracks/${track.trackId ?? track.id}`}
                                    className="block text-sm font-bold truncate text-white hover:text-neutral-600 transition-colors"
                                >
                                    {track.title}
                                </Link>

                                {track.artistName && (
                                    track.artistHandle ? (
                                        <Link
                                            href={`/profiles/${track.artistHandle}`}
                                            className="block text-[10px] text-zinc-500 uppercase truncate hover:text-white transition-colors"
                                        >
                                            {track.artistName}
                                        </Link>
                                    ) : (
                                        <p className="text-[10px] text-zinc-500 uppercase truncate">
                                            {track.artistName}
                                        </p>
                                    )
                                )}

                                <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <FaHeart className="text-[10px]" />
                                        {track.likesCount ?? 0}
                                    </span>

                                    <span className="flex items-center gap-1">
                                        <BiRepost className="text-[14px]" />
                                        {track.repostsCount ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}