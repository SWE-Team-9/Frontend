"use client";

import TimestampedCommentsSection from "@/src/components/tracks/TimestampedCommentsSection";
import React, { useState, Fragment } from "react";
import { Share2 } from "lucide-react";
import SharePopup from "@/src/components/share/SharePopup";
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
  Check,
} from "lucide-react";

import { TrackActionButtons } from "@/src/components/tracks/TrackActionButtons";
import { useRepostStore } from "@/src/store/repostStore";
import {
  changeTrackVisibility,
  getTrackDetails,
  updateTrackMetadata,
  TrackDetails,
} from "@/src/services/uploadService";
import {
  usePlayerStore,
  type Track as PlayerTrack,
} from "@/src/store/playerStore";

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
  onEdit,
}) => {
  const normalizedArtistHandle = track.artistHandle?.trim();
  const normalizedSlug = track.slug?.trim();
  const hasCanonicalTrackRoute =
    !!normalizedArtistHandle &&
    !!normalizedSlug &&
    normalizedArtistHandle.toLowerCase() !== "undefined" &&
    normalizedArtistHandle.toLowerCase() !== "null" &&
    normalizedSlug.toLowerCase() !== "undefined" &&
    normalizedSlug.toLowerCase() !== "null";
  const trackHref = hasCanonicalTrackRoute
    ? `/${normalizedArtistHandle}/${normalizedSlug}`
    : `/tracks/${track.trackId}`;

  const toEditData = (
    source: Pick<
      IntegratedTrack,
      "title" | "genre" | "releaseDate" | "description"
    >,
  ) => ({
    title: source.title,
    genre: source.genre ?? "",
    releaseDate: source.releaseDate?.split("T")[0] ?? "",
    description: source.description ?? "",
  });
  const deleteRepostAction = useRepostStore(
    (state) => state.deleteRepostAction,
  );
  const isReposted = useRepostStore((state) => state.isReposted(track.trackId));
  const handleDeleteClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click
    if (!isOwner && isReposted) {
      if (confirm("Do you want to remove your repost?")) {
        await deleteRepostAction(track.trackId);
      }
      return;
    }
    if (onDelete) {
      onDelete(track.trackId, savedData.title);
    }
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const fetchAndPlay = usePlayerStore((state) => state.fetchAndPlay);
  const toggle = usePlayerStore((state) => state.toggle);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  // Visibility state
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    (track.visibility as "PUBLIC" | "PRIVATE") ?? "PUBLIC",
  );
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const [savedData, setSavedData] = useState(() => toEditData(track));

  // Single edit data object (replaces individual editTitle, editGenre, etc.)
  const [editData, setEditData] = useState(() => toEditData(track));
  const normalizedEditData = {
    title: editData.title.trim(),
    genre: editData.genre.trim(),
    description: editData.description.trim(),
  };
  const isEditFormInvalid =
    normalizedEditData.title.length === 0 ||
    normalizedEditData.genre.length === 0 ||
    normalizedEditData.description.length === 0;

  const playerTrack: PlayerTrack = {
    trackId: track.trackId,
    title: savedData.title,
    artist: getArtistLabel(track.artistName ?? track.artist),
    artistId: track.artistId ?? "",
    artistHandle: track.artistHandle ?? undefined,
    artistAvatarUrl: track.artistAvatarUrl ?? null,
    cover:
      track.coverArtUrl || track.coverArt || "/images/track-placeholder.png",
    duration: track.durationMs
      ? Math.floor(track.durationMs / 1000)
      : undefined,
    genre: savedData.genre || undefined,
  };

  console.log("[TrackCard playerTrack]", playerTrack);

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

  const enterEdit = async () => {
    setIsPreparingEdit(true);
    setError(null);

    try {
      const latest = await getTrackDetails(track.trackId);
      const hydrated = toEditData({
        ...track,
        title: latest.title ?? track.title,
        genre: latest.genre ?? track.genre,
        releaseDate: latest.releaseDate ?? track.releaseDate,
        description: latest.description ?? track.description,
      });

      setSavedData(hydrated);
      setEditData(hydrated);
    } catch {
      // Keep the last known local values so editing can still proceed offline.
      setEditData(savedData);
    } finally {
      setIsPreparingEdit(false);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isEditFormInvalid) {
      return;
    }

    setIsSaving(true);
    try {
      setError(null);
      await updateTrackMetadata(track.trackId, {
        title: normalizedEditData.title,
        genre: normalizedEditData.genre,
        description: normalizedEditData.description,
        releaseDate: editData.releaseDate
          ? new Date(editData.releaseDate).toISOString()
          : undefined,
      });

      setSavedData({
        ...editData,
        title: normalizedEditData.title,
        genre: normalizedEditData.genre,
        description: normalizedEditData.description,
      });
      setIsEditing(false);
    } catch {
      setError("Could not save track changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayClick = async () => {
    if (track.status === "PROCESSING") return;

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

  const handleWaveformSeek = async (progress: number) => {
    if (!isCurrentTrack || duration <= 0) return;

    const nextTime = progress * duration;
    await seekTo(nextTime);
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-6 items-start hover:bg-[#252525] transition-colors relative group">
      {/* Artwork */}
      <div className="w-40 h-40 bg-[#333] rounded-md shrink-0 relative overflow-hidden">
        <Image
          src={track.coverArtUrl || track.coverArt || FALLBACK_IMAGE}
          alt={savedData.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="grow flex flex-col gap-3 min-w-0">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {isEditing ? (
          /* --- EDIT MODE --- */
          <div className="flex flex-col gap-3 bg-[#181818] p-4 rounded-md border border-zinc-700">
            {isEditFormInvalid && (
              <p className="text-xs text-red-400">
                Title, genre, and description are required.
              </p>
            )}
            <input
              value={editData.title}
              onChange={(e) => {
                setEditData((prev) => ({ ...prev, title: e.target.value }));
                if (error) setError(null);
              }}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Track Title"
              required
            />
            <input
              value={editData.genre}
              onChange={(e) => {
                setEditData((prev) => ({ ...prev, genre: e.target.value }));
                if (error) setError(null);
              }}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Genre"
              required
            />
            <textarea
              value={editData.description}
              onChange={(e) => {
                setEditData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                if (error) setError(null);
              }}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm resize-none"
              placeholder="Description"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || isEditFormInvalid}
                className="bg-white text-black px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="border border-zinc-600 text-zinc-400 px-4 py-1.5 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* --- VIEW MODE --- */
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
                  <p className="text-zinc-400 text-sm">
                    {getArtistLabel(track.artistName ?? track.artist)}
                  </p>
                  <h4 className="text-white text-xl font-bold truncate">
                    {savedData.title}
                  </h4>
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

                {/* Share button */}
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
                coverArt={track.coverArt || track.coverArtUrl || FALLBACK_IMAGE}
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
                    onClick={enterEdit}
                    disabled={isPreparingEdit}
                    className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {(isOwner || track.reposted) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        // Case 1: If the user is a reposter (and not the owner), remove the repost
                        if (!isOwner && track.reposted) {
                          try {
                            // Use the dedicated delete action from your store
                            await useRepostStore
                              .getState()
                              .deleteRepostAction(track.trackId);
                          } catch (err) {
                            console.error("Failed to remove repost:", err);
                          }
                          return;
                        }

                        // Case 2: If the user is the owner, trigger the original onDelete callback
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
        )}
      </div>
    </div>
  );
};
