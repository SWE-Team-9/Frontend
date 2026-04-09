"use client";

import React, { useState, Fragment } from 'react';
import Image from "next/image";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import {
  Play, Pause, MoreHorizontal, BarChart2, Trash2, Edit2,
  Eye, EyeOff, Check
} from 'lucide-react';

import { TrackActionButtons } from "@/src/components/tracks/TrackActionButtons";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import { changeTrackVisibility, updateTrackMetadata, TrackDetails } from "@/src/services/uploadService";
import { usePlayerStore, type Track as PlayerTrack } from "@/src/store/playerStore";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

export interface IntegratedTrack extends Partial<Omit<TrackDetails, 'coverArtUrl'>> {
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

export const TrackCard: React.FC<TrackCardProps> = ({ track, isOwner, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    (track.visibility as "PUBLIC" | "PRIVATE") ?? "PUBLIC"
  );
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Single edit data object (replaces individual editTitle, editGenre, etc.)
  const [editData, setEditData] = useState({
    title: track.title,
    genre: track.genre ?? "",
    tags: track.tags?.join(", ") ?? "",
    releaseDate: track.releaseDate?.split("T")[0] ?? "",
    description: track.description ?? "",
  });

  const playerTrack: PlayerTrack = {
    trackId: track.trackId,
    title: track.title,
    artist: getArtistLabel(track.artistName ?? track.artist),
    artistId: track.artistId || "",
    artistHandle: track.artistHandle ?? undefined,
    artistAvatarUrl: track.artistAvatarUrl ?? null,
    cover: track.coverArtUrl || track.coverArt || "/images/track-placeholder.png",
    duration: track.durationMs ? Math.floor(track.durationMs / 1000) : undefined,
    genre: track.genre ?? undefined,
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

  const enterEdit = () => {
    setEditData({
      title: track.title,
      genre: track.genre ?? "",
      tags: track.tags?.join(", ") ?? "",
      releaseDate: track.releaseDate?.split("T")[0] ?? "",
      description: track.description ?? "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setError(null);
      await updateTrackMetadata(track.trackId, {
        ...editData,
        tags: editData.tags.split(",").map((t) => t.trim()).filter(Boolean),
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
        {(track.coverArtUrl || track.coverArt) ? (
          <Image
            src={track.coverArtUrl || track.coverArt || FALLBACK_IMAGE}
            alt={track.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#2a2a2a] animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="grow flex flex-col gap-3 min-w-0">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {isEditing ? (
          /* --- EDIT MODE --- */
          <div className="flex flex-col gap-3 bg-[#181818] p-4 rounded-md border border-zinc-700">
            <input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Track Title"
            />
            <input
              value={editData.genre}
              onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Genre"
            />
            <input
              value={editData.tags}
              onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Tags (comma separated)"
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm resize-none"
              placeholder="Description"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
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
                  aria-label={isCurrentTrack && isPlaying ? "Pause track" : "Play track"}
                  title={track.status === "PROCESSING" ? "Track is still processing" : isCurrentTrack && isPlaying ? "Pause" : "Play"}
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
                  <h4 className="text-white text-xl font-bold truncate">{track.title}</h4>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${visibility === 'PUBLIC' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {visibility}
              </span>
            </div>

            {/* Waveform */}
            <div className="w-full h-16 bg-zinc-800/30 rounded relative overflow-hidden">
              {track.status === "PROCESSING" ? (
                <div className="flex items-center justify-center h-full text-[#ff5500] text-xs font-bold italic animate-pulse">
                  PROCESSING...
                </div>
              ) : (
                <WaveformDisplay
                  seed={track.trackId}
                  progress={waveformProgress}
                  onSeek={isCurrentTrack ? handleWaveformSeek : undefined}
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-auto">
              <TrackActionButtons
                trackId={track.trackId}
                title={track.title}
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
                    {visibility === "PUBLIC" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={enterEdit}
                    className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(track.trackId, track.title);
                      }}
                      className="p-2 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20 transition-colors"
                      title="Delete Track"
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