"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecentlyPlayedItem } from "@/src/types/history";
import RecentlyPlayedCard from "@/src/components/discover/RecentlyPlayedCard";

interface RecentlyPlayedRowProps {
  title?: string;
  tracks: RecentlyPlayedItem[];
}

export default function RecentlyPlayedRow({
  title = "Recently played",
  tracks,
}: RecentlyPlayedRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = rowRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const scrollLeft = () => {
    rowRef.current?.scrollBy({ left: -720, behavior: "smooth" });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 720, behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollButtons();

    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [tracks]);

  return (
    <section className="mb-14">
      <h2 className="mb-6 text-[18px] font-bold text-white">{title}</h2>

      <div className="relative">
        <div
          ref={rowRef}
          onScroll={updateScrollButtons}
          className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {tracks.map((track) => (
            <RecentlyPlayedCard key={track.trackId} track={track} />
          ))}
        </div>

        {canScrollLeft && (
          <button
            type="button"
            onClick={scrollLeft}
            className="absolute left-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show previous tracks"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={scrollRight}
            className="absolute right-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show more tracks"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}