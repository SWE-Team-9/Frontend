"use client";

import TimestampedCommentsSection from "@/src/components/tracks/TimestampedCommentsSection";
import React, { useState, Fragment } from "react";
import Image from "next/image";
import { toast } from "sonner";
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
  Link2,
  ListPlus,
  Heart,
} from "lucide-react";


import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import { useRepostStore } from "@/src/store/repostStore";
import { useLikeStore } from "@/src/store/likeStore";
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
import type { TrackData } from "@/src/types/interactions";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

export interface IntegratedTrack
  extends Partial<Omit<TrackDetails, "coverArtUrl">> {
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
  const isReposted = useRepostStore((state) =>
    state.isReposted(track.trackId),
  );

  const handleAddTrackToNextUp = () => {
  toast.success("Added to Next Up");
};
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

  // Like store — shared with the standalone Like button
  const toggleLike = useLikeStore((state) => state.toggleLike);
  const isLiked = useLikeStore((state) => state.isLiked(track.trackId));
  const isLikeLoading = useLikeStore((state) =>
    state.loadingIds.includes(track.trackId),
  );

  // Visibility state
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    (track.visibility as "PUBLIC" | "PRIVATE") ?? "PUBLIC",
  );
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const [savedData, setSavedData] = useState(() => toEditData(track));

  // Single edit data object
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

  const isCurrentTrack = currentTrack?.trackId === track.trackId;
  const waveformProgress =
    isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  // Build the TrackData shape the like store expects
  const trackForLike: TrackData = {
    id: track.trackId,
    title: savedData.title,
    artistName: getArtistLabel(track.artistName ?? track.artist),
    coverArt: track.coverArtUrl || track.coverArt,
    likesCount: track.likesCount ?? 0,
  } as TrackData;

  const handleDeleteClick = async (
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.stopPropagation();
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCopyTrackLink = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(
      `${window.location.origin}${trackHref}`,
    );
  };
    const handleShare = async () => {
      const url = `${window.location.origin}${trackHref}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: savedData.title,
            url,
          });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
        }
      } catch {
        toast.error("Share failed");
      }
    };
  

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

    onEdit?.(track);
  };

  const cancelEdit = () => {
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isEditFormInvalid) return;

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

              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  visibility === "PUBLIC"
                    ? "bg-green-900/30 text-green-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {visibility}
              </span>
            </div>

            {/* Waveform + Timestamped Comments */}
            <div className="w-full relative">
              {track.status === "PROCESSING" ? (
                <div className="h-16 flex items-center justify-center bg-[#181818] rounded text-zinc-500 text-xs uppercase tracking-widest">
                  Processing...
                </div>
              ) : (
                <>
                  <WaveformDisplay
                    progress={waveformProgress}
                    onSeek={handleWaveformSeek}
                  />
                  <TimestampedCommentsSection
                 trackId={track.trackId}
                currentPlaybackSeconds={isCurrentTrack ? currentTime : 0}
                  />
                </>
              )}

                   {/* Action row */}
                <div className="flex items-center gap-2 mt-3">

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    <Link2 size={12} />
                  </button>

                  {/* Add to Next Up */}
                  <button
                    onClick={handleAddTrackToNextUp}
                    className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    <ListPlus size={12} />
                  </button>

                  {/* Edit track */}
                  <button
                    onClick={enterEdit}
                    className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    <Edit2 size={12} />
                  </button>

                  {/* Like button */}
                  <button
                    onClick={() => toggleLike(trackForLike)}
                    disabled={isLikeLoading}
                    className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center"
                  >
                    {isLiked ? (
                      <Heart size={12} className="text-[#f50]" />
                    ) : (
                      <Heart size={12} className="text-zinc-300" />
                    )}
                  </button>

                  {/* Stats button (owner only) */}
                  {isOwner && (
                    <button className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300">
                      <BarChart2 size={12} />
                    </button>
                  )}

                  {/* More options menu */}
                  <Menu as="div" className="relative">
                    <MenuButton className="w-9 h-9 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300">
                      <MoreHorizontal size={12} />
                    </MenuButton>

                    <Transition as={Fragment}>
                      <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl py-1 z-50 focus:outline-none">

                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={handleAddTrackToNextUp}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-xs text-white ${
                                focus ? "bg-zinc-800" : ""
                              }`}
                            >
                              <ListPlus className="w-3 h-3 text-zinc-400" />
                              Add to Next Up
                            </button>
                          )}
                        </MenuItem>

                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={handleDeleteClick}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-xs text-white ${
                                focus ? "bg-zinc-800" : ""
                              }`}
                            >
                              <Trash2 className="w-3 h-3 text-zinc-400" />
                              Delete
                            </button>
                          )}
                        </MenuItem>

                        {isOwner && (
                          <>
                            <div className="my-1 h-px bg-zinc-800" />

                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  onClick={enterEdit}
                                  disabled={isPreparingEdit}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-xs text-white disabled:opacity-50 ${
                                    focus ? "bg-zinc-800" : ""
                                  }`}
                                >
                                  <Edit2 className="w-3 h-3 text-zinc-400" />
                                  Edit
                                </button>
                              )}
                            </MenuItem>

                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  onClick={handleToggleVisibility}
                                  disabled={isTogglingVisibility}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-xs text-white disabled:opacity-50 ${
                                    focus ? "bg-zinc-800" : ""
                                  }`}
                                >
                                  {visibility === "PUBLIC" ? (
                                    <EyeOff className="w-3 h-3 text-zinc-400" />
                                  ) : (
                                    <Eye className="w-3 h-3 text-zinc-400" />
                                  )}
                                  Make {visibility === "PUBLIC" ? "Private" : "Public"}
                                </button>
                              )}
                            </MenuItem>
                          </>
                        )}
                      </MenuItems>
                    </Transition>
                  </Menu>

                </div>
              </div>
              
          </>
          
        )}
      </div>
    </div>
  );
};