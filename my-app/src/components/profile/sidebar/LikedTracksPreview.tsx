"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getUserLikes } from "@/src/services/likeService";
import { TrackData } from "@/src/types/interactions";

interface LikedTracksPreviewProps {
  userId: string;
}

const PREVIEW_LIMIT = 3;

export default function LikedTracksPreview({ userId }: LikedTracksPreviewProps) {
  const [likes, setLikes] = useState<TrackData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchLikes = async () => {
      try {
        setLoading(true);
        const data = await getUserLikes(userId, 1, PREVIEW_LIMIT);

        if (!isMounted) return;
        setLikes(data);
      } catch (err) {
        console.error("Failed to fetch sidebar likes:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLikes();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
        <p className="font-bold uppercase">Your Likes</p>

        <Link
          href="/library/likes"
          className="hover:text-white transition-colors font-bold uppercase"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-zinc-600 font-bold uppercase animate-pulse">
          Loading likes...
        </p>
      ) : likes.length === 0 ? (
        <p className="text-xs text-zinc-600 font-bold uppercase">
          No liked tracks yet
        </p>
      ) : (
        likes.map((track) => (
          <Link
            key={track.id}
            href={`/tracks/${track.id}`}
            className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all"
          >
            <div className="w-10 h-10 bg-zinc-800 rounded relative overflow-hidden shrink-0">
              {(track.coverArt || track.coverArtUrl || track.imageUrl) && (
                <Image
                  src={track.coverArt || track.coverArtUrl || track.imageUrl || ""}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">
                {track.title}
              </p>

              {track.artistName && (
                <p className="text-[10px] text-zinc-500 uppercase truncate">
                  {track.artistName}
                </p>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}