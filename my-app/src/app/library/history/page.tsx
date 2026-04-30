"use client";

import { useEffect, useMemo, useState } from "react";
import LibraryTabs from "@/src/components/library/LibraryTabs";
import RecentArtistsRow from "@/src/components/library/RecentArtistsRow";
import { RecentArtistItem } from "@/src/components/library/RecentArtistCard";
import ListeningHistoryList from "@/src/components/library/ListeningHistoryList";
import { clearListeningHistory, getRecentlyPlayed } from "@/src/services/historyService";
import { ListeningHistoryItem, RecentlyPlayedItem } from "@/src/types/history";

export default function LibraryHistoryPage() {
  const [recentTracks, setRecentTracks] = useState<RecentlyPlayedItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // /player/history/recent already uses distinct: ["trackId"] — no frontend dedup needed
        const recent = await getRecentlyPlayed(100, 1);
        setRecentTracks(recent);
      } catch (error) {
        console.error("Failed to load history page:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Derive recently played artists (deduplicated by artistId)
  const recentArtists = useMemo<RecentArtistItem[]>(() => {
    const map = new Map<string, RecentArtistItem>();
    for (const track of recentTracks) {
      const existing = map.get(track.artistId);
      if (!existing || track.lastPlayedAt > existing.lastPlayedAt) {
        map.set(track.artistId, {
          artistId: track.artistId,
          name: track.artist,
          handle: track.artistHandle,
          avatarUrl: track.artistAvatarUrl,
          lastPlayedAt: track.lastPlayedAt,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      b.lastPlayedAt.localeCompare(a.lastPlayedAt),
    );
  }, [recentTracks]);

  // Map RecentlyPlayedItem → ListeningHistoryItem for the track list
  const historyItems = useMemo<ListeningHistoryItem[]>(
    () =>
      recentTracks.map((t) => ({
        trackId: t.trackId,
        title: t.title,
        artist: t.artist,
        artistId: t.artistId,
        artistHandle: t.artistHandle,
        artistAvatarUrl: t.artistAvatarUrl,
        coverArtUrl: t.coverArtUrl,
        liked: t.liked,
        likesCount: t.likesCount,
        reposted: t.reposted,
        repostsCount: t.repostsCount,
        durationSeconds: t.durationSeconds,
        playedAt: t.lastPlayedAt,
        positionSeconds: t.lastPositionSeconds,
      })),
    [recentTracks],
  );

  const normalizedFilter = filter.trim().toLowerCase();

  const filteredArtists = useMemo(() => {
    if (!normalizedFilter) return recentArtists;
    return recentArtists.filter((a) =>
      a.name.toLowerCase().includes(normalizedFilter),
    );
  }, [recentArtists, normalizedFilter]);

  const filteredHistory = useMemo(() => {
    if (!normalizedFilter) return historyItems;
    return historyItems.filter(
      (t) =>
        t.title.toLowerCase().includes(normalizedFilter) ||
        t.artist.toLowerCase().includes(normalizedFilter),
    );
  }, [historyItems, normalizedFilter]);

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearListeningHistory();
      setRecentTracks([]);
    } catch (error) {
      console.error("Failed to clear listening history:", error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <LibraryTabs />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <button
          onClick={handleClearHistory}
          disabled={clearing}
          className="text-[18px] font-semibold text-white transition hover:opacity-80 disabled:opacity-50"
        >
          {clearing ? "Clearing..." : "Clear all history"}
        </button>

        <input
          type="text"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 w-full rounded-md border border-zinc-600 bg-[#2a2a2a] px-4 text-white outline-none placeholder:text-zinc-400 md:w-[320px]"
        />
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <>
          {filteredArtists.length > 0 && (
            <RecentArtistsRow artists={filteredArtists} />
          )}

          {filteredHistory.length > 0 && (
            <ListeningHistoryList tracks={filteredHistory} />
          )}

          {!filteredArtists.length && !filteredHistory.length && (
            <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
              No listening history found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
