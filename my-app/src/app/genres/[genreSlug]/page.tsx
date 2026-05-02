"use client";

import { useEffect, useMemo, use, useState } from "react";
import NavBar from "@/src/components/ui/NavBar";
import RecentlyPlayedCard, {
  DiscoverCardTrack,
} from "@/src/components/discover/RecentlyPlayedCard";
import {
  formatGenreName,
  getTrendingTracksByGenre,
} from "@/src/services/discoveryService";
import { usePlayerStore } from "@/src/store/playerStore";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

interface GenrePageProps {
  params: Promise<{
    genreSlug: string;
  }>;
}

export default function GenreTrendingPage({ params }: GenrePageProps) {
  const { genreSlug } = use(params);

  const [tracks, setTracks] = useState<DiscoverCardTrack[]>([]);
  const [genreName, setGenreName] = useState(formatGenreName(genreSlug));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setPlayerTracks = usePlayerStore((state) => state.setTracks);

  useEffect(() => {
    async function loadGenreTracks() {
      try {
        setLoading(true);
        setError("");

        const data = await getTrendingTracksByGenre(genreSlug, 5);

        setGenreName(data.genre.name);

        const normalizedTracks: DiscoverCardTrack[] = data.tracks.map((item) => ({
          trackId: item.trackId,
          title: item.title,
          artist: item.artist.displayName,
          artistId: item.artist.id,
          artistHandle: item.artist.handle,
          artistAvatarUrl: item.artist.avatarUrl ?? null,
          coverArtUrl: item.coverArtUrl ?? null,
          likesCount: item.likesCount ?? 0,
        }));

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
      } catch (err) {
        console.error("Failed to load genre trending tracks:", err);
        setError("This genre could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadGenreTracks();
  }, [genreSlug, setPlayerTracks]);

  const contextTrackIds = useMemo(
    () => tracks.map((track) => track.trackId),
    [tracks],
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="mx-auto min-h-screen max-w-7xl px-6">
        <NavBar className="sticky top-0 z-50" />

        <main className="py-8">
          <h1 className="mb-2 text-3xl font-bold">{genreName}</h1>
          <p className="mb-8 text-sm text-zinc-400">
            Top 5 trending tracks in this genre
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="w-47.5 animate-pulse">
                  <div className="h-47.5 w-47.5 rounded-sm bg-zinc-800" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
              {error}
            </div>
          ) : tracks.length ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
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
              No trending tracks found for this genre.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}