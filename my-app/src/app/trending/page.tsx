"use client";

import { useEffect, useMemo, useState } from "react";
import RecentlyPlayedCard, {
  DiscoverCardTrack,
} from "@/src/components/discover/RecentlyPlayedCard";
import { getTrendingTracks } from "@/src/services/discoveryService";
import { usePlayerStore } from "@/src/store/playerStore";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

export default function TrendingPage() {
  const [tracks, setTracks] = useState<DiscoverCardTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const setPlayerTracks = usePlayerStore((state) => state.setTracks);

  useEffect(() => {
    async function loadTrending() {
      try {
        setLoading(true);

        const data = await getTrendingTracks(100, 7);

        const normalizedTracks: DiscoverCardTrack[] = data.items.map((item) => {
          const uploaderId = item.uploaderId || item.uploader.userId || item.uploader.id || "";
          const displayName =
            item.uploader.displayName ||
            item.uploader.display_name ||
            item.uploader.handle ||
            "Unknown Artist";

          return {
            trackId: item.id,
            title: item.title,
            artist: displayName,
            artistId: uploaderId,
            artistHandle: item.uploader.handle,
            artistAvatarUrl:
              item.uploader.avatarUrl ?? item.uploader.avatar_url ?? null,
            coverArtUrl: item.coverArtUrl || null,
            liked: item.liked ?? false,
            likesCount: item.recentLikes ?? 0,
          };
        });

        setTracks(normalizedTracks);

        setPlayerTracks(
          normalizedTracks.map((track) => ({
            trackId: track.trackId,
            title: track.title,
            artist: track.artist,
            artistId: track.artistId,
            artistHandle: track.artistHandle,
            artistAvatarUrl: track.artistAvatarUrl ?? null,
            cover: track.coverArtUrl || FALLBACK_IMAGE,
          })),
        );
      } catch (error) {
        console.error("Failed to load trending page:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTrending();
  }, [setPlayerTracks]);

  const contextTrackIds = useMemo(
    () => tracks.map((track) => track.trackId),
    [tracks],
  );

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <h1 className="mb-8 text-3xl font-bold">Trending Tracks</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="w-47.5 animate-pulse">
              <div className="h-47.5 w-47.5 rounded-sm bg-zinc-800" />
              <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : tracks.length ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {tracks.map((track) => (
            <RecentlyPlayedCard
              key={track.trackId}
              track={track}
              contextTrackIds={contextTrackIds}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
          No trending tracks available right now.
        </div>
      )}
    </div>
  );
}