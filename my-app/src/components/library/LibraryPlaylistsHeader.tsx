"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

export type PlaylistFilterMode = "all" | "created" | "liked";

interface Props {
  filter: string;
  onFilterChange: (v: string) => void;
  mode: PlaylistFilterMode;
  onModeChange: (m: PlaylistFilterMode) => void;
}

export function LibraryPlaylistsHeader({
  filter,
  onFilterChange,
  mode,
  onModeChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const label = mode === "all" ? "All" : mode === "created" ? "Created" : "Liked";

  return (
    <div className="flex items-center justify-between mb-6">
      <p className="text-zinc-400 text-sm">
        Hear your own playlists and the playlists you&apos;ve liked:
      </p>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter"
          className="bg-[#1a1a1a] border border-zinc-800 rounded px-3 py-1.5 text-sm text-white w-44 focus:outline-none focus:border-zinc-600"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-between gap-2 bg-[#1a1a1a] border border-zinc-800 rounded px-3 py-1.5 text-sm text-white w-28"
          >
            {label}
            <FaChevronDown size={10} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute z-50 right-0 top-10 w-28 bg-[#1a1a1a] border border-zinc-800 rounded shadow-2xl overflow-hidden py-1">
                {(["all", "created", "liked"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onModeChange(m);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 ${
                      mode === m ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {m === "all" ? "All" : m === "created" ? "Created" : "Liked"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}