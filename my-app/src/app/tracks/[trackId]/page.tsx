"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { getTrackDetails } from "@/src/services/uploadService";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import { DownloadButton } from "@/src/components/tracks/DownloadButton";
import {
  usePlayerStore,
  type Track as PlayerTrack,
} from "@/src/store/playerStore";

interface TrackFile {
  id: string;
  role: string;
  mimeType: string;
  format: string;
  size: number;
  status: string;
}

interface Track {
  trackId: string;
  title: string;
  slug: string;
  description: string | null;
  artist: string | null;
  artistId: string | null;
  artistHandle: string | null;
  artistAvatarUrl: string | null;
  genre: string | null;
  tags: string[];
  releaseDate: string | null;
  durationMs: number | null;
  waveformData: number[] | null;
  visibility: "PUBLIC" | "PRIVATE";
  accessLevel: string;
  status: string;
  license: string;
  allowComments: boolean;
  downloadable: boolean;
  coverArtUrl: string | null;
  secretToken: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: TrackFile[];
}

const DEFAULT_GRADIENT_CLASS =
  "bg-linear-to-r from-[#8D8284] via-[#89747C] to-[#866975]";

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const timeAgo = (iso: string | null) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
};

async function extractGradientFromImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/extract-colors?imageUrl=${encodeURIComponent(src)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { gradient: string | null };
    return data.gradient ?? null;
  } catch {
    return null;
  }
}

export default function TrackDetailPage() {
  const router = useRouter();
  const { trackId } = useParams<{ trackId: string }>();

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dynamicGradient, setDynamicGradient] = useState<string | null>(null);

  // Player
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const fetchAndPlay = usePlayerStore((state) => state.fetchAndPlay);
  const toggle = usePlayerStore((state) => state.toggle);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const isResolvingPlayback = usePlayerStore(
    (state) => state.isResolvingPlayback,
  );
  const isProcessingPlayback = usePlayerStore((state) => state.isProcessing);
  const accessState = usePlayerStore((state) => state.accessState);

  const isCurrentTrack = currentTrack?.trackId === track?.trackId;
  const waveformProgress =
    isCurrentTrack && duration > 0 ? currentTime / duration : 0;
  const isPlayDisabled =
    !track ||
    track.status === "PROCESSING" ||
    isResolvingPlayback ||
    isProcessingPlayback ||
    accessState === "BLOCKED";

  useEffect(() => {
    getTrackDetails(trackId)
      .then((data) => {
        setError(null);
        setTrack(data as unknown as Track);
      })
      .catch(() => setError("Could not load track details."))
      .finally(() => setLoading(false));
  }, [trackId]);

  useEffect(() => {
    let cancelled = false;

    if (!track?.coverArtUrl) {
      Promise.resolve().then(() => {
        if (!cancelled) setDynamicGradient(null);
      });
      return () => {
        cancelled = true;
      };
    }

    extractGradientFromImage(track.coverArtUrl).then((gradient) => {
      if (!cancelled) setDynamicGradient(gradient);
    });

    return () => {
      cancelled = true;
    };
  }, [track?.coverArtUrl]);

  async function handlePlayClick() {
    if (!track) return;
    if (isPlayDisabled) return;
    try {
      setError(null);
      if (isCurrentTrack) {
        await toggle();
        return;
      }
      const playerTrack: PlayerTrack = {
        trackId: track.trackId,
        title: track.title,
        artist: track.artist ?? "Unknown Artist",
        artistId: track.artistId ?? "",
        artistHandle: track.artistHandle ?? undefined,
        artistAvatarUrl: track.artistAvatarUrl ?? null,
        cover: track.coverArtUrl || "/images/track-placeholder.png",
        duration: track.durationMs
          ? Math.floor(track.durationMs / 1000)
          : undefined,
        genre: track.genre ?? undefined,
      };
      await fetchAndPlay(playerTrack);
    } catch {
      setError("Could not start playback. Please try again.");
    }
  }

  async function handleWaveformSeek(progress: number) {
    if (!isCurrentTrack || duration <= 0) return;
    await seekTo(progress * duration);
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center">
        <h1 className="text-[#ff5500] text-lg">Loading Track...</h1>
      </main>
    );

  if (!track)
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center">
        <h1 className="text-[#ff5500] text-lg">Track not found.</h1>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      {/* HERO */}
      <section
        className={dynamicGradient ? "" : DEFAULT_GRADIENT_CLASS}
        style={dynamicGradient ? { background: dynamicGradient } : undefined}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Left: play + title + waveform */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4 mb-6">
                <button
                  type="button"
                  onClick={handlePlayClick}
                  disabled={isPlayDisabled}
                  className="h-14 w-14 shrink-0 rounded-full bg-black flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
                >
                  {isCurrentTrack && isPlaying ? (
                    <FaPause className="text-white" size={18} />
                  ) : (
                    <FaPlay className="text-white ml-1" size={18} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-2 inline-block rounded">
                    <h1 className="text-xl md:text-2xl font-bold leading-tight">
                      {track.title}
                    </h1>
                  </div>
                  {(track.artist || track.artistHandle) && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          track.artistHandle &&
                          router.push(`/profiles/${track.artistHandle}`)
                        }
                        className="bg-black/50 backdrop-blur-sm px-2 py-1 inline-block rounded text-sm hover:bg-black/70"
                      >
                        {track.artist ?? `@${track.artistHandle}`}
                      </button>
                    </div>
                  )}
                </div>

                <div className="hidden sm:block text-sm text-white/80 shrink-0">
                  {timeAgo(track.createdAt)}
                </div>
              </div>

              {/* Waveform */}
              <div className="h-24">
                {track.waveformData && (
                  <WaveformDisplay
                    progress={waveformProgress}
                    onSeek={handleWaveformSeek}
                  />
                )}
              </div>
            </div>

            {/* Right: large cover */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 rounded overflow-hidden bg-black">
              <Image
                src={track.coverArtUrl || "/images/track-placeholder.png"}
                alt={`${track.title} cover art`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <section className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                Description
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {track.description ?? (
                  <span className="text-gray-600 italic">No description</span>
                )}
              </p>
            </section>

            {/* Artist */}
            <section className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a] flex items-center gap-3">
              {track.artistAvatarUrl ? (
                <Image
                  src={track.artistAvatarUrl}
                  alt={track.artist ?? "Artist"}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-500 text-sm font-bold">
                  {track.artist?.charAt(0) ?? "?"}
                </div>
              )}
              <div>
                <p className="text-white font-medium">
                  {track.artist ?? "Unknown Artist"}
                </p>
                {track.artistHandle && (
                  <p className="text-gray-500 text-sm">@{track.artistHandle}</p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — track details */}
          <aside className="space-y-4">
            <section className="bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Track Details
              </h3>

              <dl className="space-y-3 text-sm">
                <DetailRow label="Genre" value={track.genre ?? "—"} />
                <DetailRow
                  label="Release Date"
                  value={formatDate(track.releaseDate)}
                />
                <DetailRow
                  label="Duration"
                  value={
                    track.durationMs ? formatDuration(track.durationMs) : "—"
                  }
                />
                <DetailRow label="License" value={track.license} />
                <DetailRow
                  label="Visibility"
                  value={
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        track.visibility === "PUBLIC"
                          ? "border-blue-400 text-blue-400"
                          : "border-gray-500 text-gray-400"
                      }`}
                    >
                      {track.visibility}
                    </span>
                  }
                />
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        track.status === "FINISHED"
                          ? "border-green-500 text-green-400"
                          : track.status === "FAILED"
                            ? "border-red-500 text-red-400"
                            : "border-yellow-500 text-yellow-400"
                      }`}
                    >
                      {track.status}
                    </span>
                  }
                />
                <DetailRow
                  label="Comments"
                  value={track.allowComments ? "Allowed" : "Disabled"}
                />
                <DetailRow
                  label="Downloadable"
                  value={track.downloadable ? "Yes" : "No"}
                />
                <DetailRow
                  label="Created"
                  value={formatDate(track.createdAt)}
                />
                <DetailRow
                  label="Updated"
                  value={formatDate(track.updatedAt)}
                />
              </dl>

              {track.tags?.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {track.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {track.files?.length > 0 && (
              <section className="bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                  Files
                </h3>
                <ul className="space-y-2 text-sm">
                  {track.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-400 capitalize">
                        {file.role.toLowerCase()}
                      </span>
                      <span className="text-white">
                        {file.format} · {formatBytes(file.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {track.downloadable && <DownloadButton trackId={track.trackId} />}
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-white text-right">{value}</dd>
    </div>
  );
}