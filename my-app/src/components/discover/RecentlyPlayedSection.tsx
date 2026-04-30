"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RecentlyPlayedCard from "./RecentlyPlayedCard";
import { getRecentlyPlayed } from "@/src/services/playerService";
import { getTrackDetails } from "@/src/services/trackService";
import { usePlayerStore } from "@/src/store/playerStore";
import { RecentlyPlayedItem } from "@/src/types/history";

export default function RecentlyPlayedSection() {
    const [tracks, setTracks] = useState<RecentlyPlayedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const setPlayerTracks = usePlayerStore((state) => state.setTracks);

    const rowRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        const el = rowRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };

    const scrollLeft = () => {
        rowRef.current?.scrollBy({ left: -720, behavior: "smooth" });
    };

    const scrollRight = () => {
        rowRef.current?.scrollBy({ left: 720, behavior: "smooth" });
    };

    useEffect(() => {
        async function loadRecentlyPlayed() {
            try {
                setLoading(true);

                const recentData = await getRecentlyPlayed(6, 1);

                const detailedTracks = await Promise.all(
                    recentData.tracks.map((item) => getTrackDetails(item.trackId))
                );

                const mergedTracks: RecentlyPlayedItem[] = recentData.tracks.map((item) => {
                    const details = detailedTracks.find(
                        (track) => track.trackId === item.trackId
                    );

                    return {
                        trackId: item.trackId,
                        title: details?.title || item.title,
                        artist: details?.artist || item.artist.display_name,
                        artistId: details?.artistId || item.artist.id,
                        artistHandle: details?.artistHandle,
                        artistAvatarUrl: details?.artistAvatarUrl ?? null,
                        coverArtUrl: details?.coverArtUrl || null,
                        liked: details?.liked ?? false,
                        likesCount: details?.likesCount ?? 0,
                        lastPlayedAt: item.lastPlayedAt,
                        lastPositionSeconds: item.lastPositionSeconds,
                    };
                });

                setTracks(mergedTracks);

                setPlayerTracks(
                    mergedTracks.map((track) => ({
                        trackId: track.trackId,
                        title: track.title,
                        artist: track.artist,
                        artistId: track.artistId,
                        artistHandle: track.artistHandle,
                        artistAvatarUrl: track.artistAvatarUrl ?? null,
                        cover: track.coverArtUrl || "/images/track-placeholder.png",
                    }))
                );

            } catch (error) {
                console.error("Failed to load recently played:", error);
            } finally {
                setLoading(false);
            }
        }

        loadRecentlyPlayed();
    }, [setPlayerTracks]);

    useEffect(() => {
        updateScrollButtons();

        window.addEventListener("resize", updateScrollButtons);
        return () => window.removeEventListener("resize", updateScrollButtons);
    }, [tracks]);

    if (loading) {
        return (
            <section className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-white">Recently Played</h2>
                <div className="flex gap-8">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="w-47.5 animate-pulse">
                            <div className="h-47.5 w-47.5 rounded-sm bg-zinc-800" />
                            <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!tracks.length) {
        return (
            <section className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-white">Recently Played</h2>
                <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
                    Start playing tracks and they’ll appear here.
                </div>
            </section>
        );
    }

    return (
        <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold text-white">Recently Played</h2>

            <div className="relative">
                <div
                    ref={rowRef}
                    onScroll={updateScrollButtons}
                    className="flex gap-8 overflow-x-auto overflow-y-visible scroll-smooth pb-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {tracks.map((track) => (
                        <RecentlyPlayedCard
                            key={track.trackId}
                            track={track}
                            contextTrackIds={tracks.map((t) => t.trackId)}
                        />
                    ))}
                </div>

                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={scrollLeft}
                        className="absolute left-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show previous recently played tracks"
                    >
                        <ChevronLeft size={28} />
                    </button>
                )}

                {canScrollRight && (
                    <button
                        type="button"
                        onClick={scrollRight}
                        className="absolute right-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show more recently played tracks"
                    >
                        <ChevronRight size={28} />
                    </button>
                )}
            </div>
        </section>
    );
}