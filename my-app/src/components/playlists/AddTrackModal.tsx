"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaMusic, FaSearch } from "react-icons/fa";

interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trackId: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function AddTrackModal({ isOpen, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
      setAddingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/tracks/search?q=${encodeURIComponent(query)}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(data)
          ? data
          : data.tracks ?? data.data?.tracks ?? data.results ?? [];

        setResults(
          list.map((t) => ({
            trackId: t.trackId ?? t.id ?? t._id,
            title: t.title ?? "Untitled",
            artist: t.artist ?? t.user?.display_name,
            cover: t.cover ?? t.artwork,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (trackId: string) => {
    setAddingId(trackId);
    setError(null);
    try {
      await onAdd(trackId);
      setResults((prev) => prev.filter((t) => t.trackId !== trackId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add track");
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Add Track
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for tracks..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-sm focus:border-[#f50] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <p className="text-red-400 text-xs px-6 py-3">{error}</p>
          )}

          {isSearching && (
            <p className="text-zinc-500 text-xs text-center py-8">Searching...</p>
          )}

          {!isSearching && query && results.length === 0 && !error && (
            <p className="text-zinc-500 text-xs text-center py-8">No results</p>
          )}

          {!query && (
            <p className="text-zinc-500 text-xs text-center py-8">
              Start typing to search tracks
            </p>
          )}

          <div className="divide-y divide-zinc-900">
            {results.map((track) => (
              <div
                key={track.trackId}
                className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/50"
              >
                <div className="w-10 h-10 rounded bg-[#222] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {track.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaMusic className="text-zinc-600 text-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  {track.artist && (
                    <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(track.trackId)}
                  disabled={addingId === track.trackId}
                  className="px-3 py-1.5 bg-[#f50] hover:bg-[#e64a00] text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 disabled:opacity-50"
                >
                  <FaPlus size={9} />
                  {addingId === track.trackId ? "Adding..." : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}