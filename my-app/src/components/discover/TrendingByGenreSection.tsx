"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { GENRES, formatGenreName } from "@/src/services/discoveryService";

export default function TrendingByGenreSection() {
    const rowRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
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

        setTimeout(checkScroll, 300); // allow smooth scroll to update
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
    }, []);

    return (
        <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold text-white">Trending by Genre</h2>

            <div className="relative">
                <div
                    ref={rowRef}
                    className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-6 scrollbar-hide"
                >
                    {GENRES.map((genre) => (
                        <button
                            key={genre}
                            type="button"
                            onClick={() => router.push(`/genres/${genre}`)}
                            className="flex h-40 w-64 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-[#181818] px-6 text-center text-3xl font-bold text-whitex hover:border-[#ff5500] hover:bg-[#ff5500] hover:text-black transition duration-200"
                        >
                            {formatGenreName(genre)}
                        </button>
                    ))}
                </div>

                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-14 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show previous genres"
                    >
                        <ChevronLeft size={28} />
                    </button>
                )}

                {canScrollRight && (
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-14 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg hover:bg-zinc-700"
                        aria-label="Show more genres"
                    >
                        <ChevronRight size={28} />
                    </button>
                )}
            </div>
        </section>
    );
}