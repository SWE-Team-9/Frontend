"use client";

import { useEffect, useState } from "react";
import RecentlyPlayedCard from "./RecentlyPlayedCard";
import { getRecentlyPlayed } from "@/src/services/playerService";
import { getTrackDetails } from "@/src/services/trackService";
import { usePlayerStore } from "@/src/store/playerStore";
import { RecentlyPlayedItem } from "@/src/types/history";

export default function RecentlyPlayedSection() {
    const [tracks, setTracks] = useState<RecentlyPlayedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const setPlayerTracks = usePlayerStore((state) => state.setTracks);

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
    }, []);

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

            <div className="flex gap-8 overflow-x-auto overflow-y-visible pb-16">
                {tracks.map((track) => (
                    <RecentlyPlayedCard
                        key={track.trackId}
                        track={track}
                    />
                ))}
            </div>
        </section>
    );
}