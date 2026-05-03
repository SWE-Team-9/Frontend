"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlaylistCard } from "@/src/components/playlists/PlaylistCard";
import { playlistsApi } from "@/src/services/playlistsService";
import type { Playlist } from "@/src/types/playlist";

export default function TopPlaylistsSection() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const rowRef = useRef<HTMLDivElement | null>(null);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: direction === "right" ? 720 : -720,
      behavior: "smooth",
    });

    setTimeout(checkScroll, 300);
  };

  useEffect(() => {
    async function loadTopPlaylists() {
      try {
        setLoading(true);
        const data = await playlistsApi.getTopPlaylists();
        setPlaylists(data);
      } catch (error) {
        console.error("Failed to load top playlists:", error);
      } finally {
        setLoading(false);
        setTimeout(checkScroll, 0);
      }
    }

    loadTopPlaylists();
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [playlists.length]);

  if (loading) {
    return (
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-white">Top Playlists</h2>

        <div className="flex gap-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="w-47.5 shrink-0 animate-pulse">
              <div className="h-47.5 w-47.5 rounded-md bg-zinc-800" />
              <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!playlists.length) {
    return (
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-white">Top Playlists</h2>

        <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
          No top playlists available right now.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-14">
      <h2 className="mb-6 text-2xl font-bold text-white">Top Playlists</h2>

      <div className="relative">
        <div
          ref={rowRef}
          className="flex gap-8 overflow-x-auto overflow-y-visible scroll-smooth pb-16 scrollbar-hide"
        >
          {playlists.map((playlist) => (
            <div key={playlist.playlistId} className="w-47.5 shrink-0">
              <PlaylistCard playlist={playlist} variant="profile" />
            </div>
          ))}
        </div>

        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show previous playlists"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show more playlists"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}