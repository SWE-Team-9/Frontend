"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaMusic, FaSearch } from "react-icons/fa";
import { searchService } from "@/src/services/searchService";
import type { SearchTrack } from "@/src/types/search";
import Image from "next/image";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trackId: string) => Promise<void>;
}

export function AddTrackModal({ isOpen, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const trimmed = query.trim();
    const delay = trimmed ? 350 : 0;

    const timer = setTimeout(async () => {
      if (!trimmed) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);
      try {
        const res = await searchService.search({ q: trimmed, type: "tracks" });
        setResults(res.data.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (trackId: string) => {
    setAddingId(trackId);
    setError(null);
    try {
      await onAdd(trackId);
      setResults((prev) => prev.filter((t) => t.id !== trackId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add track");
    } finally {
      setAddingId(null);
    }
  };

  const visibleResults = query.trim() ? results : [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#121212] border border-neutral-700 rounded-md shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Add Track
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-neutral-700">
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

          {!isSearching && query.trim() && visibleResults.length === 0 && !error && (
            <p className="text-zinc-500 text-xs text-center py-8">No results</p>
          )}

          {!query && (
            <p className="text-zinc-500 text-xs text-center py-8">
              Start typing to search tracks
            </p>
          )}

          <div className="divide-y divide-zinc-900">
            {visibleResults.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/50"
              >
                <div className="relative w-10 h-10 rounded bg-[#222] flex items-center justify-center shrink-0 overflow-hidden">
                  {track.artwork_url ? (
                    <Image
                      src={track.artwork_url}
                      alt={track.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <FaMusic className="text-zinc-600 text-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  {track.artist_handle && (
                    <p className="text-xs text-zinc-500 truncate">
                      {track.artist_handle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(track.id)}
                  disabled={addingId === track.id}
                  className="px-3 py-1.5 bg-[#f50] hover:bg-[#e64a00] text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 disabled:opacity-50"
                >
                  <FaPlus size={9} />
                  {addingId === track.id ? "Adding..." : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}