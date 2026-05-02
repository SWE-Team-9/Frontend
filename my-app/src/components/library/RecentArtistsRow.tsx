"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RecentArtistCard, { RecentArtistItem } from "./RecentArtistCard";

interface RecentArtistsRowProps {
  title?: string;
  artists: RecentArtistItem[];
}

export default function RecentArtistsRow({
  title = "Recently played:",
  artists,
}: RecentArtistsRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: direction === "right" ? 600 : -600,
      behavior: "smooth",
    });

    setTimeout(checkScroll, 300);
  };

  useEffect(() => {
    checkScroll();

    const el = rowRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [artists]);

  if (!artists.length) return null;

  return (
    <section className="mb-14">
      <h2 className="mb-6 text-[18px] font-bold text-white">{title}</h2>

      <div className="relative">
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-6 scrollbar-hide"
        >
          {artists.map((artist) => (
            <RecentArtistCard key={artist.artistId} artist={artist} />
          ))}
        </div>

        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show previous artists"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
            aria-label="Show more artists"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}