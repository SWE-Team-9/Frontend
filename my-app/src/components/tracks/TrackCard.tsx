"use client";

import TimestampedCommentsSection from "@/src/components/tracks/TimestampedCommentsSection";
import React, { useState, Fragment } from "react";
import { Share2 } from "lucide-react";
import SharePopup from "@/src/components/share/SharePopup";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import {
  Play,
  Pause,
  MoreHorizontal,
  BarChart2,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react";

import { EditTrackModal } from "@/src/components/tracks/EditTrackModal";
import { TrackActionButtons } from "@/src/components/tracks/TrackActionButtons";
import { useRepostStore } from "@/src/store/repostStore";
import {
  changeTrackVisibility,
  getTrackDetails,
  TrackDetails,
} from "@/src/services/uploadService";
import {
  usePlayerStore,
  type Track as PlayerTrack,
} from "@/src/store/playerStore";
import { loadQueue } from "@/src/services/playerService";
import { buildTrackPermalink } from "@/src/lib/permalinks";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

export interface IntegratedTrack extends Partial<
  Omit<TrackDetails, "coverArtUrl">
> {
  trackId: string;
  title: string;
  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;
  artistName?: string;
  coverArt?: string;
  coverArtUrl?: string;
}

interface TrackCardProps {
  track: IntegratedTrack;
  isOwner?: boolean;
  onDelete?: (id: string, title: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (track: any) => void;
  contextTrackIds?: string[];
}

function getArtistLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "displayName" in value &&
    typeof (value as { displayName?: unknown }).displayName === "string"
  ) {
    return (value as { displayName: string }).displayName;
  }
  return "Unknown Artist";
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isOwner,
  onDelete,
  onEdit: _onEdit,
  contextTrackIds,
}) => {
  const trackHref = buildTrackPermalink({
    trackId: track.trackId,
    artistHandle: track.artistHandle,
    slug: track.slug,
  });

  const hasCanonicalTrackRoute = !trackHref.startsWith("/tracks/");

  const deleteRepostAction = useRepostStore((state) => state.deleteRepostAction);
  const isReposted = useRepostStore((state) => state.isReposted(track.trackId));

  const [shareOpen, setShareOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const fetchAndPlay = usePlayerStore((state) => state.fetchAndPlay);
  const toggle = usePlayerStore((state) => state.toggle);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    (track.visibility as "PUBLIC" | "PRIVATE") ?? "PUBLIC",
  );
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Tracks the locally-saved display data; updated optimistically after modal saves
  const [savedData, setSavedData] = useState({
    title: track.title,
    genre: track.genre ?? "",
    tags: track.tags ?? [],
    releaseDate: track.releaseDate?.split("T")[0] ?? "",
    description: track.description ?? "",
    coverArtUrl: track.coverArtUrl ?? track.coverArt ?? null,
  });

  // Populated fresh from the server each time the modal opens
  const [editInitialData, setEditInitialData] = useState(savedData);

  const playerTrack: PlayerTrack = {
    trackId: track.trackId,
    title: savedData.title,
    artist: getArtistLabel(track.artistName ?? track.artist),
    artistId: track.artistId ?? "",
    artistHandle: track.artistHandle ?? undefined,
    artistAvatarUrl: track.artistAvatarUrl ?? null,
    cover: savedData.coverArtUrl || FALLBACK_IMAGE,
    duration: track.durationMs ? Math.floor(track.durationMs / 1000) : undefined,
    genre: savedData.genre || undefined,
  };

  const isCurrentTrack = currentTrack?.trackId === track.trackId;
  const waveformProgress =
    isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setIsTogglingVisibility(true);
    try {
      setError(null);
      await changeTrackVisibility(track.trackId, newVisibility);
      setVisibility(newVisibility);
    } catch {
      setError("Could not change visibility. Please try again.");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const openEditModal = async () => {
    setIsPreparingEdit(true);
    setError(null);
    try {
      const latest = await getTrackDetails(track.trackId);
      setEditInitialData({
        title: latest.title ?? savedData.title,
        genre: latest.genre ?? savedData.genre,
        tags: latest.tags ?? savedData.tags,
        releaseDate: latest.releaseDate?.split("T")[0] ?? savedData.releaseDate,
        description: latest.description ?? savedData.description,
        coverArtUrl: latest.coverArtUrl ?? savedData.coverArtUrl,
      });
    } catch {
      // Fall back to last known values so editing can still proceed offline
      setEditInitialData(savedData);
    } finally {
      setIsPreparingEdit(false);
      setIsEditModalOpen(true);
    }
  };

  const handleModalSaved = (updated: typeof savedData) => {
    setSavedData(updated);
  };

  const handlePlayClick = async () => {
    if (track.status === "PROCESSING") return;
    try {
      setError(null);
      if (isCurrentTrack) {
        await toggle();
        return;
      }
      if (contextTrackIds && contextTrackIds.length > 1) {
        const resp = await loadQueue({
          contextType: "CONTEXT_IDS",
          trackIds: contextTrackIds,
          startTrackId: playerTrack.trackId,
        });
        usePlayerStore.setState({
          currentQueueIndex: resp.currentIndex,
          queueLength: resp.queueLength,
          tracksUntilAd: resp.tracksUntilAd,
          currentAd: null,
          isPlayingAd: false,
          queueVersion: usePlayerStore.getState().queueVersion + 1,
        });
        await fetchAndPlay(playerTrack, true);
      } else {
        await fetchAndPlay(playerTrack);
      }
    } catch {
      setError("Could not start playback. Please try again.");
    }
  };

  const handleWaveformSeek = async (progress: number) => {
    if (!isCurrentTrack || duration <= 0) return;
    await seekTo(progress * duration);
  };

  return (
    <>
      {isEditModalOpen && (
        <EditTrackModal
          trackId={track.trackId}
          initialData={editInitialData}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}

      <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-6 items-start hover:bg-[#252525] transition-colors relative group">
        {/* Artwork */}
        <div className="w-40 h-40 bg-[#333] rounded-md shrink-0 relative overflow-hidden">
          <Image
            src={savedData.coverArtUrl || FALLBACK_IMAGE}
            alt={savedData.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="grow flex flex-col gap-3 min-w-0">
          {error && <p className="text-xs text-red-400">{error}</p>}

          <>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handlePlayClick}
                  disabled={track.status === "PROCESSING"}
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={
                    isCurrentTrack && isPlaying ? "Pause track" : "Play track"
                  }
                  title={
                    track.status === "PROCESSING"
                      ? "Track is still processing"
                      : isCurrentTrack && isPlaying
                        ? "Pause"
                        : "Play"
                  }
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black" />
                  )}
                </button>
                <div className="truncate">
                  {track.artistHandle ? (
                    <Link
                      href={`/profiles/${track.artistHandle}`}
                      className="block truncate text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {getArtistLabel(track.artistName ?? track.artist)}
                    </Link>
                  ) : (
                    <p className="truncate text-sm text-zinc-400">
                      {getArtistLabel(track.artistName ?? track.artist)}
                    </p>
                  )}
                  <Link
                    href={trackHref}
                    className="block truncate text-xl font-bold text-white transition duration-200 hover:text-zinc-600"
                  >
                    {savedData.title}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2 relative">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    visibility === "PUBLIC"
                      ? "bg-green-900/30 text-green-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {visibility}
                </span>

                <button
                  onClick={() => setShareOpen((v) => !v)}
                  disabled={!hasCanonicalTrackRoute}
                  title={
                    hasCanonicalTrackRoute
                      ? "Share this track"
                      : "Permalink not available yet"
                  }
                  className="flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="h-3 w-3" /> Share
                </button>

                {shareOpen && hasCanonicalTrackRoute && (
                  <SharePopup
                    permalink={trackHref}
                    resourceType="TRACK"
                    resourceId={track.trackId}
                    resourceTitle={savedData.title}
                    resourceCoverArtUrl={savedData.coverArtUrl}
                    onClose={() => setShareOpen(false)}
                  />
                )}
              </div>
            </div>

            {/* Waveform + Timestamped Comments */}
            <div className="w-full relative">
              {track.status === "PROCESSING" ? (
                <div className="flex h-16 items-center justify-center rounded bg-zinc-800/30 text-xs font-bold italic text-[#ff5500] animate-pulse">
                  PROCESSING...
                </div>
              ) : (
                <TimestampedCommentsSection
                  trackId={track.trackId}
                  trackTitle={savedData.title}
                  trackOwnerId={track.artistId ?? undefined}
                  durationSeconds={playerTrack.duration ?? 0}
                  waveformData={track.waveformData ?? null}
                  waveformSeed={track.trackId}
                  waveformProgress={waveformProgress}
                  onSeek={isCurrentTrack ? handleWaveformSeek : undefined}
                  currentPlaybackSeconds={isCurrentTrack ? currentTime : 0}
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-auto">
              <TrackActionButtons
                key={track.trackId}
                trackId={track.trackId}
                title={savedData.title}
                likesCount={track.likesCount ?? 0}
                liked={track.liked ?? false}
                artistName={getArtistLabel(track.artistName ?? track.artist)}
                artistId={track.artistId ?? undefined}
                artistHandle={track.artistHandle ?? undefined}
                artistAvatarUrl={track.artistAvatarUrl ?? null}
                coverArt={savedData.coverArtUrl || FALLBACK_IMAGE}
                repostsCount={track.repostsCount ?? 0}
                reposted={track.reposted ?? false}
                size="full"
              />

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleVisibility}
                    disabled={isTogglingVisibility}
                    className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white disabled:opacity-50"
                    title="Toggle Visibility"
                  >
                    {visibility === "PUBLIC" ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={openEditModal}
                    disabled={isPreparingEdit}
                    className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white disabled:opacity-50"
                    title="Edit Track"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {(isOwner || isReposted) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!isOwner && isReposted) {
                          try {
                            await useRepostStore
                              .getState()
                              .deleteRepostAction(track.trackId);
                          } catch (err) {
                            console.error("Failed to remove repost:", err);
                          }
                          return;
                        }
                        if (isOwner && onDelete) {
                          onDelete(track.trackId, savedData.title);
                        }
                      }}
                      className="p-2 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20 transition-colors"
                      title={isOwner ? "Delete Track" : "Remove Repost"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="relative">
                    <Menu>
                      <MenuButton className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 bottom-full mb-2 w-48 rounded-md bg-[#181818] border border-zinc-800 z-50">
                          <MenuItem>
                            {({ active }: { active: boolean }) => (
                              <button
                                className={`${active ? "bg-zinc-800" : ""} text-zinc-300 group flex w-full items-center px-4 py-2 text-sm`}
                              >
                                <BarChart2 className="mr-2 h-4 w-4" />
                                Insights
                              </button>
                            )}
                          </MenuItem>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              )}
            </div>
          </>
        </div>
      </div>
    </>
  );
};