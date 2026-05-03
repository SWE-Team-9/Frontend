"use client";

import { use, useEffect, useMemo, useState } from "react";
import NavBar from "@/src/components/ui/NavBar";
import {
  TrackCard,
  type IntegratedTrack,
} from "@/src/components/tracks/TrackCard";
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

  const [tracks, setTracks] = useState<IntegratedTrack[]>([]);
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

        const normalizedTracks = data.tracks.map<IntegratedTrack>((item) => ({
          trackId: item.trackId,
          title: item.title,
          slug: item.slug,

          artistName: item.artist.displayName,
          artistId: item.artist.id,
          artistHandle: item.artist.handle ?? undefined,
          artistAvatarUrl: item.artist.avatarUrl ?? null,

          genre: item.genre.name,
          coverArtUrl: item.coverArtUrl ?? undefined,
          coverArt: item.coverArtUrl ?? undefined,

          durationMs: item.durationMs,
          waveformData: item.waveformData ?? [],

          likesCount: item.likesCount ?? 0,
          repostsCount: item.repostsCount ?? 0,
          liked: false,
          reposted: false,

          status: "FINISHED",
          visibility: "PUBLIC",

          publishedAt: item.publishedAt,
          createdAt: item.createdAt,
        }));

        setTracks(normalizedTracks);

        setPlayerTracks(
          normalizedTracks.map((track) => ({
            trackId: track.trackId,
            title: track.title,
            artist: track.artistName ?? "Unknown Artist",
            artistId: track.artistId ?? "",
            artistHandle: track.artistHandle ?? undefined,
            artistAvatarUrl: track.artistAvatarUrl ?? null,
            cover: track.coverArtUrl || FALLBACK_IMAGE,
            duration: track.durationMs
              ? Math.floor(track.durationMs / 1000)
              : undefined,
            genre:
              typeof track.genre === "string" ? track.genre : undefined,
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
            <div className="space-y-6">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse gap-6 rounded-lg bg-[#1e1e1e] p-5"
                >
                  <div className="h-40 w-40 shrink-0 rounded-md bg-zinc-800" />
                  <div className="flex grow flex-col gap-4">
                    <div className="h-4 w-32 rounded bg-zinc-800" />
                    <div className="h-6 w-64 rounded bg-zinc-800" />
                    <div className="h-16 w-full rounded bg-zinc-800" />
                    <div className="h-8 w-52 rounded bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
              {error}
            </div>
          ) : tracks.length ? (
            <div className="space-y-6">
              {tracks.map((track) => (
                <TrackCard
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