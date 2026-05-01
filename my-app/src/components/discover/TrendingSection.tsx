"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import RecentlyPlayedCard, {
    DiscoverCardTrack,
} from "./RecentlyPlayedCard";
import { getTrendingTracks } from "@/src/services/discoveryService";
import { usePlayerStore } from "@/src/store/playerStore";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

export default function TrendingSection() {
    const [tracks, setTracks] = useState<DiscoverCardTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const rowRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const router = useRouter();
    const setPlayerTracks = usePlayerStore((state) => state.setTracks);

    useEffect(() => {
        async function loadTrending() {
            try {
                setLoading(true);

                const data = await getTrendingTracks(20, 7);

                const normalizedTracks: DiscoverCardTrack[] = data.items.map((item) => {
                    const uploaderId = item.uploaderId || item.uploader.userId || item.uploader.id || "";
                    const displayName =
                        item.uploader.displayName ||
                        item.uploader.display_name ||
                        item.uploader.handle ||
                        "Unknown Artist";

                    return {
                        trackId: item.id,
                        title: item.title,
                        artist: displayName,
                        artistId: uploaderId,
                        artistHandle: item.uploader.handle,
                        artistAvatarUrl:
                            item.uploader.avatarUrl ?? item.uploader.avatar_url ?? null,
                        coverArtUrl: item.coverArtUrl || null,
                        liked: item.liked ?? false,
                        likesCount: item.recentLikes ?? 0,
                    };
                });

                setTracks(normalizedTracks);

                setPlayerTracks(
                    normalizedTracks.map((track) => ({
                        trackId: track.trackId,
                        title: track.title,
                        artist: track.artist,
                        artistId: track.artistId,
                        artistHandle: track.artistHandle,
                        artistAvatarUrl: track.artistAvatarUrl ?? null,
                        cover: track.coverArtUrl || FALLBACK_IMAGE,
                    })),
                );
            } catch (error) {
                console.error("Failed to load trending tracks:", error);
            } finally {
                setLoading(false);
            }
        }

        loadTrending();
    }, [setPlayerTracks]);

    const previewTracks = useMemo(() => tracks.slice(0, 10), [tracks]);
    const contextTrackIds = useMemo(
        () => previewTracks.map((track) => track.trackId),
        [previewTracks],
    );



    const updateScrollButtons = () => {
        const el = rowRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };

    const scrollLeft = () => {
        rowRef.current?.scrollBy({
            left: -720,
            behavior: "smooth",
        });
    };

    const scrollRight = () => {
        rowRef.current?.scrollBy({
            left: 720,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        updateScrollButtons();

        window.addEventListener("resize", updateScrollButtons);
        return () => window.removeEventListener("resize", updateScrollButtons);
    }, [previewTracks]);

    if (loading) {
        return (
            <section className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-white">Trending</h2>
                <div className="flex gap-8">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="w-47.5 animate-pulse">
                            <div className="h-47.5 w-47.5 rounded-sm bg-zinc-800" />
                            <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
                            <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!tracks.length) {
        return (
            <section className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-white">Trending</h2>
                <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
                    No trending tracks available right now.
                </div>
            </section>
        );
    }

    return (
        <section className="mb-14">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Trending</h2>

                {tracks.length > 10 && (
                    <button
                        type="button"
                        onClick={() => router.push("/trending")}
                        className="text-sm font-semibold text-zinc-400 hover:text-white"
                    >
                        View more
                    </button>
                )}
            </div>

            <div className="relative">
                <div
                    ref={rowRef}
                    onScroll={updateScrollButtons}
                    className="flex gap-8 overflow-x-auto overflow-y-visible scroll-smooth pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {previewTracks.map((track) => (
                        <RecentlyPlayedCard
                            key={track.trackId}
                            track={track}
                            contextTrackIds={contextTrackIds}
                        />
                    ))}
                </div>

                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={scrollLeft}
                        className="absolute left-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show previous trending tracks"
                    >
                        <ChevronLeft size={28} />
                    </button>
                )}

                {canScrollRight && (
                    <button
                        type="button"
                        onClick={scrollRight}
                        className="absolute right-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show more trending tracks"
                    >
                        <ChevronRight size={28} />
                    </button>
                )}
            </div>
        </section>
    );
}