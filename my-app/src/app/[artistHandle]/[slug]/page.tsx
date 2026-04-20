"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Play,
  Pause,
  MoreHorizontal,
  Download,
  MessageCircle,
  BarChart2,
} from "lucide-react";
import {
  getTrackDetails,
  type TrackDetails,
} from "@/src/services/uploadService";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import {
  usePlayerStore,
  type Track as PlayerTrack,
} from "@/src/store/playerStore";
import { TrackActionButtons } from "@/src/components/tracks/TrackActionButtons";

const FALLBACK_COVER = "/images/track-placeholder.png";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  return formatTime(totalSeconds);
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TrackPage() {
  const { slug: routeSlug } = useParams<{ artistHandle: string; slug: string }>();
  const slug = Array.isArray(routeSlug) ? routeSlug[0] : routeSlug;

  const [track, setTrack] = useState<TrackDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const isProcessing = usePlayerStore((state) => state.isProcessing);
  const isResolvingPlayback = usePlayerStore((state) => state.isResolvingPlayback);
  const accessState = usePlayerStore((state) => state.accessState);
  const fetchAndPlay = usePlayerStore((state) => state.fetchAndPlay);
  const toggle = usePlayerStore((state) => state.toggle);
  const seekTo = usePlayerStore((state) => state.seekTo);

  useEffect(() => {
    let active = true;

    if (!artistHandle || !slug) {
      return;
    }

    getTrackDetailsByArtistHandleAndSlug(artistHandle, slug)
      .then((data) => {
        if (!active) return;
        setTrack(data);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setTrack(null);
        setError("Could not load track details.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistHandle, slug]);

  const playerTrack = useMemo<PlayerTrack | null>(() => {
    if (!track) return null;

    return {
      trackId: track.trackId,
      title: track.title,
      artist: track.artist ?? "Unknown Artist",
      artistId: track.artistId ?? "",
      artistHandle: track.artistHandle ?? undefined,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
      cover: track.coverArtUrl || FALLBACK_COVER,
      duration: track.durationMs ? Math.floor(track.durationMs / 1000) : undefined,
      genre: track.genre ?? undefined,
    };
  }, [track]);

  const isCurrentTrack = !!playerTrack && currentTrack?.trackId === playerTrack.trackId;
  const currentSeconds = isCurrentTrack ? currentTime : 0;
  const durationSeconds = isCurrentTrack ? duration : playerTrack?.duration ?? 0;
  const waveformProgress =
    isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  const isTrackBlocked = isCurrentTrack && accessState === "BLOCKED";
  const isTrackProcessing = track?.status === "PROCESSING";
  const disablePlayButton =
    !playerTrack ||
    !track ||
    isTrackProcessing ||
    (isCurrentTrack && (isProcessing || isResolvingPlayback || isTrackBlocked));

  const handlePlayClick = async () => {
    if (!playerTrack || !track || isTrackProcessing) return;

    try {
      setError(null);

      if (isCurrentTrack) {
        await toggle();
        return;
      }

      await fetchAndPlay(playerTrack);
    } catch {
      setError("Could not start playback. Please try again.");
    }
  };

  const handleWaveformSeek = async (nextProgress: number) => {
    if (!isCurrentTrack || duration <= 0 || isTrackBlocked) return;
    await seekTo(nextProgress * duration);
  };

  if (!artistHandle || !slug) {
    return (
      <main className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="text-red-400 text-lg">Invalid track URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="text-[#ff5500] text-lg">Loading track...</p>
      </main>
    );
  }

  if (error || !track) {
    return (
      <main className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="text-red-400 text-lg">{error ?? "Track not found."}</p>
      </main>
    );
  }

  const trackWithEngagement = track as TrackDetails & {
    likesCount?: number;
    liked?: boolean;
    repostsCount?: number;
    reposted?: boolean;
  };

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans">
      <div
        className="relative w-full h-100 overflow-hidden"
        style={{
          background: track.coverArtUrl
            ? undefined
            : "linear-gradient(135deg, #8D8284 0%, #89747C 40%, #866975 100%)",
        }}
      >
        {track.coverArtUrl && (
          <div
            className="absolute inset-0 scale-110 blur-2xl opacity-40 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${track.coverArtUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        <div className="relative z-10 flex items-stretch">
          <div className="flex-1 min-w-0 px-6 pt-6 pb-0 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayClick}
                disabled={disablePlayButton}
                className="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:bg-black/70 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isCurrentTrack && isPlaying ? "Pause track" : "Play track"}
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="w-6 h-6 fill-white text-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white text-white ml-1" />
                )}
              </button>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight truncate">{track.title}</h1>
                <p className="text-[#ff5500] text-sm mt-0.5">
                  {track.artistHandle ?? track.artist ?? "unknown"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {(isCurrentTrack && isResolvingPlayback) || isTrackProcessing || isTrackBlocked ? (
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {isCurrentTrack && isResolvingPlayback && (
                    <span className="text-zinc-300">Loading playback...</span>
                  )}
                  {isTrackProcessing && (
                    <span className="text-yellow-400">Track is still processing.</span>
                  )}
                  {isTrackBlocked && (
                    <span className="text-red-400">This track is unavailable right now.</span>
                  )}
                </div>
              ) : null}

              <div className="flex justify-between text-[10px] text-white/50 px-0.5">
                <span>{formatTime(currentSeconds)}</span>
                <span>{durationSeconds > 0 ? formatTime(durationSeconds) : "-"}</span>
              </div>

              <WaveformDisplay
                data={track.waveformData}
                seed={track.trackId}
                progress={waveformProgress}
                onSeek={
                  isCurrentTrack && !isTrackBlocked ? handleWaveformSeek : undefined
                }
              />
            </div>
          </div>

          <div className="shrink-0 self-stretch flex items-start">
            <div
              className="relative overflow-hidden"
              style={{ width: 200, height: 200, minWidth: 200 }}
            >
              <img
                src={track.coverArtUrl || FALLBACK_COVER}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1 px-6 py-2 mt-6 border-t border-white/10">
          <TrackActionButtons
            trackId={track.trackId}
            title={track.title}
            artistName={track.artist ?? "Unknown Artist"}
            coverArt={track.coverArtUrl || FALLBACK_COVER}
            likesCount={trackWithEngagement.likesCount ?? 0}
            liked={trackWithEngagement.liked ?? false}
            repostsCount={trackWithEngagement.repostsCount ?? 0}
            reposted={trackWithEngagement.reposted ?? false}
            size="full"
          />

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/60 hover:text-white transition">
            <MessageCircle className="w-4 h-4" />
            <span>5</span>
          </button>

          {track.downloadable && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/60 hover:text-white transition">
              <Download className="w-4 h-4" />
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/60 hover:text-white transition">
              <BarChart2 className="w-4 h-4" />
              Stats
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/60 hover:text-white transition">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-6 py-6 mx-auto">
        <div className="w-64 shrink-0">
          <div className="bg-zinc-900 rounded-lg p-4 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Track Info
            </h3>
            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-0.5">
                  Genre
                </span>
                <span className="text-white">{track.genre ?? "-"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-0.5">
                  Released
                </span>
                <span className="text-white">{formatDate(track.releaseDate)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-0.5">
                  Duration
                </span>
                <span className="text-white">
                  {track.durationMs ? formatDuration(track.durationMs) : "-"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-0.5">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {track.tags.length ? (
                    track.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic text-sm">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Visibility</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    track.visibility === "PUBLIC"
                      ? "border-blue-400 text-blue-400"
                      : "border-gray-500 text-gray-400"
                  }`}
                >
                  {track.visibility}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Processing</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    track.status === "FINISHED"
                      ? "border-green-500 text-green-400"
                      : "border-yellow-500 text-yellow-400"
                  }`}
                >
                  {track.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Comments</span>
                <span className="text-white text-xs">
                  {track.allowComments ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
