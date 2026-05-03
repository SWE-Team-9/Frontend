"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserTracks, TrackDetails } from "@/src/services/uploadService";
import { getUserReposts } from "@/src/services/repostService";
import { usePlaylists } from "@/src/hooks/usePlaylists";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import { ProfilePlaylistCard } from "@/src/components/profile/ProfilePlaylistCard";
import { TrackData } from "@/src/types/interactions";
import { Playlist } from "@/src/types/playlist";

type DateLikeItem = {
    repostedAt?: string | null;
    interactedAt?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type ProfilePlaylist = Playlist & DateLikeItem;

type TrackLikeItem = TrackDetails & DateLikeItem;

type RepostLikeItem = TrackData & DateLikeItem;

type ActivityItem =
    | {
        kind: "track";
        id: string;
        date: string;
        track: TrackLikeItem;
    }
    | {
        kind: "repost";
        id: string;
        date: string;
        track: TrackLikeItem;
    }
    | {
        kind: "playlist";
        id: string;
        date: string;
        playlist: ProfilePlaylist;
    };

interface ProfileAllActivityProps {
    userId: string;
    isOwner: boolean;
    onTracksTotalChange?: (count: number) => void;
}

function getDateValue(item: DateLikeItem) {
    return (
        item.repostedAt ||
        item.interactedAt ||
        item.publishedAt ||
        item.createdAt ||
        item.updatedAt ||
        item.created_at ||
        item.updated_at ||
        ""
    );
}

export default function ProfileAllActivity({
    userId,
    isOwner,
    onTracksTotalChange,
}: ProfileAllActivityProps) {
    const [tracks, setTracks] = useState<TrackLikeItem[]>([]);
    const [reposts, setReposts] = useState<RepostLikeItem[]>([]);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [loadingReposts, setLoadingReposts] = useState(true);

    const {
        playlists,
        isLoading: loadingPlaylists,
        error: playlistsError,
    } = usePlaylists(userId, isOwner);

    useEffect(() => {
        let isMounted = true;

        async function loadTracks() {
            try {
                setLoadingTracks(true);
                const data = await getUserTracks(userId, 1, 10);

                if (!isMounted) return;

                const nextTracks = (data.tracks || []) as TrackLikeItem[];
                setTracks(nextTracks);
                onTracksTotalChange?.(data.totalTracks ?? nextTracks.length ?? 0);
            } catch (error) {
                console.error("Failed to load profile tracks:", error);
                if (isMounted) setTracks([]);
            } finally {
                if (isMounted) setLoadingTracks(false);
            }
        }

        loadTracks();

        return () => {
            isMounted = false;
        };
    }, [userId, onTracksTotalChange]);

    useEffect(() => {
        let isMounted = true;

        async function loadReposts() {
            try {
                setLoadingReposts(true);
                const data = await getUserReposts(userId);

                if (!isMounted) return;

                setReposts(data as RepostLikeItem[]);
            } catch (error) {
                console.error("Failed to load profile reposts:", error);
                if (isMounted) setReposts([]);
            } finally {
                if (isMounted) setLoadingReposts(false);
            }
        }

        loadReposts();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const activityItems = useMemo<ActivityItem[]>(() => {
        const trackItems: ActivityItem[] = tracks.map((track) => ({
            kind: "track",
            id: `track-${track.trackId}`,
            date: getDateValue(track),
            track,
        }));

        const repostItems: ActivityItem[] = reposts.map((track) => ({
            kind: "repost",
            id: `repost-${track.trackId ?? track.id}`,
            date: getDateValue(track),
            track: {
                ...track,
                trackId: track.trackId ?? track.id,
                status: "FINISHED",
                visibility: "PUBLIC",
                artist: track.artistName ?? "Unknown Artist",
                coverArtUrl: track.coverArtUrl ?? track.coverArt ?? track.imageUrl ?? null,
            } as TrackLikeItem,
        }));

        const playlistItems: ActivityItem[] = (playlists as ProfilePlaylist[]).map(
            (playlist) => ({
                kind: "playlist",
                id: `playlist-${playlist.playlistId}`,
                date: getDateValue(playlist),
                playlist,
            }),
        );

        return [...trackItems, ...repostItems, ...playlistItems].sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
        });
    }, [tracks, reposts, playlists]);

    const isLoading = loadingTracks || loadingReposts || loadingPlaylists;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <p className="text-zinc-400 animate-pulse uppercase tracking-widest text-sm">
                    Loading profile activity...
                </p>
            </div>
        );
    }

    if (playlistsError) {
        console.error("Failed to load profile playlists:", playlistsError);
    }

    if (activityItems.length === 0) {
        return (
            <div className="w-full py-20 text-center flex flex-col items-center border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500 italic">No profile activity found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6 bg-[#121212] rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wider">
                All
                <span className="text-zinc-500 text-lg"> ({activityItems.length})</span>
            </h2>

            {activityItems.map((item) => {
                if (item.kind === "playlist") {
                    return (
                        <div key={item.id} className="rounded-lg bg-[#1e1e1e] p-5">
                            <p className="mb-3 text-xs font-bold uppercase text-zinc-500">
                                Playlist
                            </p>
                            <ProfilePlaylistCard playlist={item.playlist} />
                        </div>
                    );
                }

                const stableTrackId = String(
                    (item.track as { id?: string | number }).id ?? item.track.trackId,
                );

                return (
                    <div key={item.id}>
                        <p className="mb-2 text-xs font-bold uppercase text-zinc-500">
                            {item.kind === "repost" ? "Repost" : "Track"}
                        </p>

                        <TrackCard
                            track={{
                                ...item.track,
                                trackId: stableTrackId,
                                artistId: item.track.artistId || userId,
                                artistHandle: item.track.artistHandle ?? undefined,
                                artistAvatarUrl: item.track.artistAvatarUrl ?? null,
                                coverArtUrl: item.track.coverArtUrl ?? undefined,
                                genre: item.track.genre ?? undefined,
                            }}
                            isOwner={isOwner && item.kind === "track"}
                        />
                    </div>
                );
            })}
        </div>
    );
}