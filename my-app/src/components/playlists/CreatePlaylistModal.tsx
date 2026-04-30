"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaSearch, FaMusic, FaPlus, FaCheck } from "react-icons/fa";
import { CreatePlaylistInput, Playlist } from "@/src/types/playlist";
import { toast } from "sonner";

interface TrackResult {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlaylistInput) => Promise<Playlist>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function CreatePlaylistModal({ isOpen, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "SECRET">("SECRET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<TrackResult[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        const res = await fetch(
          `${API_BASE_URL}/api/v1/tracks/search?q=${encodeURIComponent(trimmed)}`,
          {
            credentials: "include",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(data)
          ? data
          : (data.tracks ?? data.data?.tracks ?? data.results ?? []);

        setSearchResults(
          list.map((t) => ({
            trackId: t.trackId ?? t.id ?? t._id,
            title: t.title ?? "Untitled",
            artist: t.artist ?? t.user?.display_name,
            cover: t.cover ?? t.artwork ?? t.coverArtUrl,
          })),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Derive displayed results from query — avoids calling setState in effect body
  const displayResults = query.trim() ? searchResults : [];

  const handleToggleTrack = (track: TrackResult) => {
    setSelectedTracks((prev) => {
      const exists = prev.some((t) => t.trackId === track.trackId);
      if (exists) return prev.filter((t) => t.trackId !== track.trackId);
      return [...prev, track];
    });
  };

  const isSelected = (trackId: string) =>
    selectedTracks.some((t) => t.trackId === trackId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (selectedTracks.length === 0) {
      setError("You must add at least one track to create a playlist.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newPlaylist = await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        trackIds: selectedTracks.map((t) => t.trackId),
      });

      toast.success(`"${newPlaylist.title}" was created`);
      setTitle("");
      setDescription("");
      setVisibility("SECRET");
      setSelectedTracks([]);
      setQuery("");
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
        className="w-full max-w-lg bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
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

            {/* TRACK SEARCH */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Add Tracks <span className="text-red-400">*</span>
              </label>

              {/* Selected tracks */}
              {selectedTracks.length > 0 && (
                <div className="mb-2 space-y-1">
                  {selectedTracks.map((t) => (
                    <div
                      key={t.trackId}
                      className="flex items-center gap-2 bg-[#121212] border border-zinc-800 rounded px-3 py-1.5"
                    >
                      <FaMusic className="text-[#f50] text-xs shrink-0" />
                      <span className="flex-1 text-xs text-white truncate">
                        {t.title}
                      </span>
                      {t.artist && (
                        <span className="text-xs text-zinc-500 truncate">
                          {t.artist}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleTrack(t)}
                        className="text-zinc-500 hover:text-red-400 ml-1"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for tracks to add..."
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors"
                />
              </div>

              {/* Search results */}
              {(isSearching || displayResults.length > 0) && (
                <div className="mt-1 max-h-44 overflow-y-auto border border-zinc-800 rounded bg-[#121212] divide-y divide-zinc-900">
                  {isSearching && (
                    <p className="text-zinc-500 text-xs text-center py-4">
                      Searching...
                    </p>
                  )}
                  {!isSearching &&
                    displayResults.map((track) => (
                      <button
                        key={track.trackId}
                        type="button"
                        onClick={() => handleToggleTrack(track)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 text-left"
                      >
                        <div className="w-8 h-8 rounded bg-[#222] flex items-center justify-center shrink-0 overflow-hidden">
                          {track.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={track.cover}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaMusic className="text-zinc-600 text-xs" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">
                            {track.title}
                          </p>
                          {track.artist && (
                            <p className="text-[10px] text-zinc-500 truncate">
                              {track.artist}
                            </p>
                          )}
                        </div>
                        {isSelected(track.trackId) ? (
                          <FaCheck size={10} className="text-[#f50] shrink-0" />
                        ) : (
                          <FaPlus
                            size={10}
                            className="text-zinc-400 shrink-0"
                          />
                        )}
                      </button>
                    ))}
                </div>
              )}

              {query.trim() && !isSearching && displayResults.length === 0 && (
                <p className="text-zinc-500 text-xs mt-2">No tracks found.</p>
              )}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
            <span className="text-xs text-zinc-500">
              {selectedTracks.length} track
              {selectedTracks.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !title.trim() || selectedTracks.length === 0
                }
                className="px-5 py-2 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
