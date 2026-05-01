"use client";

import { useEffect, useState } from "react";
import { getUserLikes } from "@/src/services/likeService";
import { TrackData } from "@/src/types/interactions";
import { TrackCard } from "@/src/components/tracks/TrackCard";

interface LikedTracksGridProps {
  userId: string;
}

const LIKES_LIMIT = 10;

export default function LikedTracksGrid({ userId }: LikedTracksGridProps) {
  const [likes, setLikes] = useState<TrackData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchLikes = async () => {
      try {
        setLoading(true);

        const data = await getUserLikes(userId, page, LIKES_LIMIT);

        if (!isMounted) return;

        const cleaned = data.map((t: TrackData) => ({
          ...t,
          artistName: t.artistName ?? undefined,
          coverArt: t.coverArt ?? undefined,
        }));

        setLikes(cleaned);
      } catch (err) {
        console.error("Failed to fetch likes:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLikes();

    return () => {
      isMounted = false;
    };
  }, [userId, page]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500 uppercase animate-pulse">
        Loading likes...
      </p>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold text-zinc-600 uppercase">
          No liked tracks yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Track list */}
      <div className="grid grid-cols-1 gap-6 w-full max-w-5xl">
        {likes.map((track) => (
          <TrackCard
            key={track.id}
            track={{
              trackId: track.id,
              title: track.title,
              likesCount: track.likesCount,
              liked: true,
            }}
            isOwner={false}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6 mt-12">
        <button
          disabled={page === 1}
          onClick={() => {
            setPage((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
        >
          Previous
        </button>

        <span className="text-white font-black text-sm uppercase tracking-widest">
          Page {page}
        </span>

        <button
          disabled={likes.length < LIKES_LIMIT}
          onClick={() => {
            setPage((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}