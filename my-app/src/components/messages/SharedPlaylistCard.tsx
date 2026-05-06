"use client";

import Image from "next/image";
import { MoreHorizontal, Play } from "lucide-react";
import { useState } from "react";
import { FiShare } from "react-icons/fi";
import { TbCopy } from "react-icons/tb";
import { FaHeart } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import type { SharedPlaylist, SharedTrack } from "@/src/types/messages";
import { usePlayerStore, type Track as PlayerTrack } from "@/src/store/playerStore";
import SharePopup from "@/src/components/share/SharePopup";
import {
    buildFullShareUrl,
    buildPlaylistPermalink,
    buildTrackPermalink,
} from "@/src/lib/permalinks";
import { messageService } from "@/src/services/messageService";
import MessageWaveform from "@/src/components/messages/MessageWaveform";
import { TrackPageLink, UserProfileLink } from "@/src/components/navigation/EntityLinks";
import Link from "next/link";
import { playlistsApi } from "@/src/services/playlistsService";
import { useLikeStore } from "@/src/store/likeStore";
import { useRepostStore } from "@/src/store/repostStore";
import type { TrackData } from "@/src/types/interactions";
import TrackCardMenu from "@/src/components/discover/TrackCardMenu";

const FALLBACK = "/images/track-placeholder.png";
const ACCENT = "#ff5500";

function formatCount(n = 0) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return String(n);
}

function mapSharedTrackToPlayerTrack(track: SharedTrack): PlayerTrack {
    return {
        trackId: track.id,
        title: track.title,
        artist: track.artist.display_name,
        artistId: track.artist.id,
        artistHandle: track.artist.handle,
        artistAvatarUrl: track.artist.avatar_url ?? null,
        cover: track.coverArtUrl || FALLBACK,
        duration: track.durationSeconds,
        plays: track.playCount,
        accessState: "PLAYABLE",
    };
}

function mapSharedTrackToTrackData(track: SharedTrack): TrackData {
    return {
        id: track.id,
        trackId: track.id,
        title: track.title,
        artistName: track.artist.display_name,
        artistId: track.artist.id,
        artistHandle: track.artist.handle,
        artistAvatarUrl: track.artist.avatar_url ?? null,
        likesCount: track.likesCount ?? 0,
        repostsCount: track.repostsCount ?? 0,
        coverArtUrl: track.coverArtUrl ?? null,
        coverArt: track.coverArtUrl ?? null,
        imageUrl: track.coverArtUrl ?? null,
        slug: track.slug,
        waveformData: track.waveformData ?? null,
    };
}

export default function SharedPlaylistCard({
    playlist,
}: {
    playlist: SharedPlaylist;
}) {
    const [shareOpen, setShareOpen] = useState(false);
    const [trackShareOpen, setTrackShareOpen] = useState<SharedTrack | null>(null);
    const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);

    const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
        "idle",
    );

    const [playlistLiked, setPlaylistLiked] = useState(() => playlist.liked ?? false);
    const [playlistLikesCount, setPlaylistLikesCount] = useState(
        () => playlist.likesCount ?? 0,
    );
    const [isPlaylistLikeLoading, setIsPlaylistLikeLoading] = useState(false);

    const [expandedPlaylist, setExpandedPlaylist] = useState<SharedPlaylist | null>(null);
    const [isLoadingFullPlaylist, setIsLoadingFullPlaylist] = useState(false);
    const [playlistError, setPlaylistError] = useState<string | null>(null);

    const toggleLike = useLikeStore((s) => s.toggleLike);
    const isLiked = useLikeStore((s) => s.isLiked);
    const likeLoadingIds = useLikeStore((s) => s.loadingIds);

    const toggleRepost = useRepostStore((s) => s.toggleRepost);
    const isReposted = useRepostStore((s) => s.isReposted);
    const repostLoadingIds = useRepostStore((s) => s.loadingIds);

    const visiblePlaylist = expandedPlaylist ?? playlist;
    const visibleTracks = visiblePlaylist.tracksPreview ?? [];
    const isExpanded = !!expandedPlaylist;

    const playlistHref = buildPlaylistPermalink({
        playlistId: playlist.id,
        ownerHandle: playlist.owner?.handle,
        slug: playlist.slug,
    });

    const fullUrl = buildFullShareUrl(playlistHref);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopyStatus("success");
        } catch {
            setCopyStatus("error");
        }

        setTimeout(() => setCopyStatus("idle"), 1500);
    };

    const handleCopyTrack = async (track: SharedTrack) => {
        const trackHref = buildTrackPermalink({
            trackId: track.id,
            artistHandle: track.artist.handle,
            slug: track.slug,
        });

        try {
            await navigator.clipboard.writeText(buildFullShareUrl(trackHref));
            setCopyStatus("success");
        } catch {
            setCopyStatus("error");
        }

        setTimeout(() => setCopyStatus("idle"), 1500);
    };

    const handlePlaylistLike = async () => {
        if (isPlaylistLikeLoading) return;

        const wasLiked = playlistLiked;

        setPlaylistLiked(!wasLiked);
        setPlaylistLikesCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
        setIsPlaylistLikeLoading(true);

        try {
            if (wasLiked) {
                await playlistsApi.unlikePlaylist(playlist.id);
            } else {
                await playlistsApi.likePlaylist(playlist.id);
            }
        } catch {
            setPlaylistLiked(wasLiked);
            setPlaylistLikesCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
        } finally {
            setIsPlaylistLikeLoading(false);
        }
    };

    const setTracks = usePlayerStore((s) => s.setTracks);
    const playTrackFromContext = usePlayerStore((s) => s.playTrackFromContext);
    const addTrackToNextUp = usePlayerStore((s) => s.addTrackToNextUp);
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const toggle = usePlayerStore((s) => s.toggle);

    const currentTime = usePlayerStore((s) => s.currentTime);
    const duration = usePlayerStore((s) => s.duration);
    const seekTo = usePlayerStore((s) => s.seekTo);

    const playlistTracks = visibleTracks.map(mapSharedTrackToPlayerTrack);
    const firstTrack = visibleTracks[0];

    const currentPlaylistTrack =
        visibleTracks.find((track) => track.id === currentTrack?.trackId) ?? null;

    const waveformTrack = currentPlaylistTrack ?? firstTrack;

    const isWaveformTrackCurrent =
        !!waveformTrack && currentTrack?.trackId === waveformTrack.id;

    const waveformProgress =
        isWaveformTrackCurrent && duration > 0 ? currentTime / duration : 0;

    const handleWaveformSeek = async (progress: number) => {
        if (!isWaveformTrackCurrent || duration <= 0) return;

        await seekTo(progress * duration);
    };

    const playPlaylistFromTrack = async (track: SharedTrack) => {
        const playerTracks = visibleTracks.map(mapSharedTrackToPlayerTrack);
        const clickedTrack = mapSharedTrackToPlayerTrack(track);

        setTracks(playerTracks);

        await playTrackFromContext({
            track: clickedTrack,
            contextType: "PLAYLIST",
            contextId: playlist.id,
        });
    };

    const handlePlayPlaylist = async () => {
        if (!firstTrack) return;
        await playPlaylistFromTrack(firstTrack);
    };

    const handleViewTracks = async () => {
        if (isExpanded) {
            setExpandedPlaylist(null);
            return;
        }

        try {
            setIsLoadingFullPlaylist(true);
            setPlaylistError(null);

            const fullPlaylist = await messageService.getPlaylistDetailsForSharing(playlist.id);
            setExpandedPlaylist(fullPlaylist);
        } catch {
            setPlaylistError("Could not load full playlist.");
        } finally {
            setIsLoadingFullPlaylist(false);
        }
    };

    return (
        <div className="mt-3 max-w-170 text-white">
            <div className="flex gap-5">
                <div className="relative h-40 w-40 shrink-0 overflow-hidden bg-zinc-800">
                    <Image
                        src={playlist.coverArtUrl || firstTrack?.coverArtUrl || FALLBACK}
                        alt={playlist.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={handlePlayPlaylist}
                            disabled={playlistTracks.length === 0}
                            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-50"
                            aria-label="Play playlist"
                        >
                            <Play className="ml-0.5 h-5 w-5 fill-black" />
                        </button>

                        <div className="min-w-0">
                            <UserProfileLink
                                handle={playlist.owner.handle}
                                className="block truncate text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                                {playlist.owner.display_name}
                            </UserProfileLink>

                            <Link
                                href={playlistHref}
                                className="block truncate text-base font-bold text-white hover:text-zinc-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {playlist.title}
                            </Link>
                        </div>
                    </div>

                    {waveformTrack && (
                        <MessageWaveform
                            waveformData={waveformTrack.waveformData}
                            waveformSeed={waveformTrack.id}
                            progress={waveformProgress}
                            currentSeconds={isWaveformTrackCurrent ? currentTime : 0}
                            durationSeconds={waveformTrack.durationSeconds ?? 0}
                            onSeek={isWaveformTrackCurrent ? handleWaveformSeek : undefined}
                        />
                    )}

                    <div className="mt-3 space-y-1">
                        {visibleTracks.map((track, index) => {
                            const isCurrentTrack = currentTrack?.trackId === track.id;
                            const trackHref = buildTrackPermalink({
                                trackId: track.id,
                                artistHandle: track.artist.handle,
                                slug: track.slug,
                            });

                            const trackData = mapSharedTrackToTrackData(track);
                            const liked = isLiked(track.id);
                            const reposted = isReposted(track.id);
                            const likeLoading = likeLoadingIds.includes(String(track.id));
                            const repostLoading = repostLoadingIds.includes(String(track.id));

                            return (
                                <div
                                    key={track.id}
                                    className="group relative flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                                >
                                    <button
                                        onClick={() => playPlaylistFromTrack(track)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                        <span className="w-4 text-right font-bold text-zinc-500">
                                            {index + 1}
                                        </span>

                                        <div className="relative h-8 w-8 shrink-0 overflow-hidden bg-zinc-800">
                                            <Image
                                                src={track.coverArtUrl || FALLBACK}
                                                alt={track.title}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />

                                            <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                                                <Play className="h-4 w-4 fill-white text-white" />
                                            </div>
                                        </div>

                                        <UserProfileLink
                                            handle={track.artist.handle}
                                            className="truncate text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {track.artist.display_name}
                                        </UserProfileLink>

                                        <TrackPageLink
                                            trackId={track.id}
                                            artistHandle={track.artist.handle}
                                            slug={track.slug}
                                            className="truncate font-bold text-white hover:text-zinc-600 transition-colors"
                                        >
                                            · {track.title}
                                        </TrackPageLink>
                                    </button>

                                    <div className="ml-auto flex items-center gap-3">
                                        <span className="text-xs text-zinc-500 group-hover:hidden">
                                            {isCurrentTrack && isPlaying
                                                ? "Playing"
                                                : `▶ ${formatCount(track.playCount)}`}
                                        </span>

                                        <div className="hidden items-center gap-3 group-hover:flex">
                                            <button
                                                onClick={() => toggleLike(trackData)}
                                                disabled={likeLoading}
                                                className="text-zinc-300 hover:text-[#ff5500] disabled:opacity-50"
                                                title="Like"
                                            >
                                                <FaHeart
                                                    className="h-4 w-4"
                                                    style={{ color: liked ? ACCENT : "#d4d4d8" }}
                                                />
                                            </button>

                                            <button
                                                onClick={() => toggleRepost(trackData)}
                                                disabled={repostLoading}
                                                className="text-zinc-300 hover:text-[#ff5500] disabled:opacity-50"
                                                title="Repost"
                                            >
                                                <BiRepost
                                                    className="h-5 w-5"
                                                    style={{ color: reposted ? ACCENT : "#d4d4d8" }}
                                                />
                                            </button>

                                            <button
                                                onClick={() => setTrackShareOpen(track)}
                                                className="text-zinc-300 hover:text-white"
                                                title="Share"
                                            >
                                                <FiShare className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => handleCopyTrack(track)}
                                                className="text-zinc-300 hover:text-white"
                                                title="Copy link"
                                            >
                                                <TbCopy className="h-4 w-4" />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenuTrackId((current) =>
                                                            current === track.id ? null : track.id,
                                                        )
                                                    }
                                                    className="text-zinc-300 hover:text-white"
                                                    title="More"
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>

                                                <TrackCardMenu
                                                    isOpen={openMenuTrackId === track.id}
                                                    onAddToNextUp={async () => {
                                                        await addTrackToNextUp(track.id);
                                                        setOpenMenuTrackId(null);
                                                    }}
                                                    onAddToPlaylist={() => {
                                                        setOpenMenuTrackId(null);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {trackShareOpen?.id === track.id && (
                                        <SharePopup
                                            permalink={trackHref}
                                            resourceType="TRACK"
                                            resourceId={track.id}
                                            resourceTitle={track.title}
                                            resourceCoverArtUrl={track.coverArtUrl || null}
                                            onClose={() => setTrackShareOpen(null)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-3">
                        <button
                            onClick={handleViewTracks}
                            disabled={isLoadingFullPlaylist}
                            className="text-sm font-bold text-white hover:underline disabled:opacity-50"
                        >
                            {isLoadingFullPlaylist
                                ? "Loading tracks..."
                                : isExpanded
                                    ? "Show less"
                                    : `View ${playlist.tracksCount ?? 0} tracks`}
                        </button>

                        {playlistError && (
                            <p className="mt-2 text-xs text-red-400">{playlistError}</p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={() => setShareOpen(true)}
                            className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                            title="Share"
                        >
                            <FiShare className="h-4 w-4" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={handleCopy}
                                className={`rounded p-2 text-zinc-300 hover:bg-zinc-700 ${copyStatus === "success"
                                    ? "bg-green-700"
                                    : copyStatus === "error"
                                        ? "bg-red-700"
                                        : "bg-zinc-800"
                                    }`}
                                title={
                                    copyStatus === "success"
                                        ? "Copied!"
                                        : copyStatus === "error"
                                            ? "Copy failed"
                                            : "Copy link"
                                }
                            >
                                <TbCopy className="h-4 w-4" />
                            </button>

                            {copyStatus !== "idle" && (
                                <span
                                    className={`absolute left-1/2 top-10 z-20 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs font-bold text-white shadow ${copyStatus === "success" ? "bg-green-700" : "bg-red-700"
                                        }`}
                                >
                                    {copyStatus === "success" ? "Copied!" : "Copy failed"}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handlePlaylistLike}
                            disabled={isPlaylistLikeLoading}
                            className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                            title="Like playlist"
                        >
                            <FaHeart
                                className="h-4 w-4"
                                style={{ color: playlistLiked ? "#ff5500" : "#d4d4d8" }}
                            />
                        </button>

                        <span className="ml-auto text-xs text-zinc-400">
                            ♥ {formatCount(playlistLikesCount)}
                        </span>
                    </div>

                    {shareOpen && (
                        <SharePopup
                            permalink={playlistHref}
                            resourceType="PLAYLIST"
                            resourceId={playlist.id}
                            resourceTitle={playlist.title}
                            resourceCoverArtUrl={playlist.coverArtUrl || null}
                            onClose={() => setShareOpen(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}