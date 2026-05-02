"use client";

import { useState } from "react";
import { FaTimes, FaMusic, FaPlus, FaCheck, FaSearch } from "react-icons/fa";
import { CreatePlaylistInput, Playlist } from "@/src/types/playlist";
import type { SearchTrack } from "@/src/types/search";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlaylistInput) => Promise<Playlist>;
  availableTracks?: SearchTrack[];
  isSearchingTracks?: boolean;
  trackQuery?: string;
  onTrackQueryChange?: (q: string) => void;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  onSubmit,
  availableTracks = [],
  isSearchingTracks = false,
  trackQuery = "",
  onTrackQueryChange,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "SECRET">("SECRET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<SearchTrack[]>([]);

  const handleToggleTrack = (track: SearchTrack) => {
    setSelectedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) return prev.filter((t) => t.id !== track.id);
      return [...prev, track];
    });
  };

  const isSelected = (id: string) => selectedTracks.some((t) => t.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (selectedTracks.length === 0) {
      setError("Select at least one track from your search results.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newPlaylist = await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        trackIds: selectedTracks.map((t) => t.id),
      });

      toast.success(`"${newPlaylist.title}" was created`);
      setTitle("");
      setDescription("");
      setVisibility("SECRET");
      setSelectedTracks([]);
      onClose();
    } catch {
      setError("Could not save right now. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
className="w-full max-w-lg bg-[#121212] border border-neutral-700 rounded-md shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-wider cursor-pointer text-white">
            Create Playlist
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* TITLE */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My new playlist"
                className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* VISIBILITY */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "PUBLIC" | "SECRET")
                }
                className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors"
              >
                <option value="SECRET">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>

            {/* TRACK SELECTION */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Add Tracks <span className="text-red-400">*</span>
              </label>

              {/* Track search input */}
              <div className="relative mb-2">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => onTrackQueryChange?.(e.target.value)}
                  placeholder="Search tracks to add..."
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors"
                />
              </div>

              {/* Results list */}
              {isSearchingTracks && (
                <p className="text-zinc-500 text-xs text-center py-4 border border-zinc-800 rounded bg-[#121212]">
                  Searching...
                </p>
              )}

              {!isSearchingTracks &&
                trackQuery.trim() &&
                availableTracks.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-4 border border-zinc-800 rounded bg-[#121212]">
                    No tracks found.
                  </p>
                )}

              {!isSearchingTracks && availableTracks.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded bg-[#121212] divide-y divide-zinc-900">
                  {availableTracks.map((track) => {
                    const selected = isSelected(track.id);
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleToggleTrack(track)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                          selected ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="w-9 h-9 rounded bg-[#222] flex items-center justify-center shrink-0 overflow-hidden">
                          {track.artwork_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={track.artwork_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaMusic className="text-zinc-600 text-xs" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate font-medium">
                            {track.title}
                          </p>
                          {track.artist_handle && (
                            <p className="text-[10px] text-zinc-500 truncate">
                              {track.artist_handle}
                            </p>
                          )}
                        </div>
                        {selected ? (
                          <FaCheck size={10} className="text-[#f50] shrink-0" />
                        ) : (
                          <FaPlus
                            size={10}
                            className="text-zinc-400 shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected chips */}
              {selectedTracks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedTracks.map((t) => (
                    <span
                      key={t.id}
                      className="flex items-center gap-1 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded"
                    >
                      {t.title}
                      <button
                        type="button"
                        onClick={() => handleToggleTrack(t)}
                        className="text-zinc-400 hover:text-red-400 ml-1"
                      >
                        <FaTimes size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-700 shrink-0">
            <span className="text-xs text-zinc-500">
              {selectedTracks.length} track
              {selectedTracks.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !title.trim() || selectedTracks.length === 0
                }
                className="px-5 py-2 bg-white hover:bg-zinc-600 text-black text-sm font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
