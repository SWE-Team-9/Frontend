"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import { FiShare } from "react-icons/fi";
import { TbCopy } from "react-icons/tb";
import { FaHeart } from "react-icons/fa";
import type { SharedPlaylist, SharedTrack } from "@/src/types/messages";
import { usePlayerStore, type Track as PlayerTrack } from "@/src/store/playerStore";
import SharePopup from "@/src/components/share/SharePopup";
import { buildFullShareUrl, buildPlaylistPermalink } from "@/src/lib/permalinks";
import { messageService } from "@/src/services/messageService";
import MessageWaveform from "@/src/components/messages/MessageWaveform";

const FALLBACK = "/images/track-placeholder.png";

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

export default function SharedPlaylistCard({
    playlist,
}: {
    playlist: SharedPlaylist;
}) {
    const [shareOpen, setShareOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
        "idle",
    );
    const [playlistLiked, setPlaylistLiked] = useState(false);

    const [expandedPlaylist, setExpandedPlaylist] = useState<SharedPlaylist | null>(null);
    const [isLoadingFullPlaylist, setIsLoadingFullPlaylist] = useState(false);
    const [playlistError, setPlaylistError] = useState<string | null>(null);

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

    const setTracks = usePlayerStore((s) => s.setTracks);
    const fetchAndPlay = usePlayerStore((s) => s.fetchAndPlay);
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

        if (currentTrack?.trackId === clickedTrack.trackId) {
            await toggle();
            return;
        }

        // Playlist queue = playlist tracks.
        setTracks(playerTracks);
        await fetchAndPlay(clickedTrack);
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
        <div className="mt-3 max-w-[680px] text-white">
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
                            <p className="truncate text-sm font-bold text-zinc-400">
                                {playlist.owner.display_name}
                            </p>
                            <p className="truncate text-base font-bold text-white">
                                {playlist.title}
                            </p>
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

                    <div className="mt-3 space-y-2">
                        {visibleTracks.map((track, index) => {
                            const isCurrentTrack = currentTrack?.trackId === track.id;

                            return (
                                <button
                                    key={track.id}
                                    onClick={() => playPlaylistFromTrack(track)}
                                    className="flex w-full items-center gap-2 text-left text-sm text-zinc-300 hover:text-white"
                                >
                                    <span className="w-4 text-right text-zinc-500">
                                        {index + 1}
                                    </span>

                                    <div className="relative h-7 w-7 shrink-0 overflow-hidden bg-zinc-800">
                                        <Image
                                            src={track.coverArtUrl || FALLBACK}
                                            alt={track.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    <span className="truncate text-zinc-400">
                                        {track.artist.display_name}
                                    </span>

                                    <span className="truncate font-bold text-white">
                                        · {track.title}
                                    </span>

                                    <span className="ml-auto shrink-0 text-xs text-zinc-500">
                                        {isCurrentTrack && isPlaying ? "Playing" : `▶ ${formatCount(track.playCount)}`}
                                    </span>
                                </button>
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
                            onClick={() => setPlaylistLiked((v) => !v)}
                            className="rounded bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                            title="Like playlist"
                        >
                            <FaHeart
                                className="h-4 w-4"
                                style={{ color: playlistLiked ? "#ff5500" : "#d4d4d8" }}
                            />
                        </button>

                        <span className="ml-auto text-xs text-zinc-400">
                            {playlistLiked ? "♥ 1" : ""}
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