"use client";

import { useEffect, useMemo, useState } from "react";
import LibraryTabs from "@/src/components/library/LibraryTabs";
import RecentlyPlayedRow from "@/src/components/library/RecentlyPlayedRow";
import ListeningHistoryList from "@/src/components/library/ListeningHistoryList";
import { clearListeningHistory, getListeningHistory, getRecentlyPlayed } from "@/src/services/historyService";
import { ListeningHistoryItem, RecentlyPlayedItem } from "@/src/types/history";

export default function LibraryHistoryPage() {
  const [recentTracks, setRecentTracks] = useState<RecentlyPlayedItem[]>([]);
  const [historyTracks, setHistoryTracks] = useState<ListeningHistoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [recent, history] = await Promise.all([
          getRecentlyPlayed(6, 1),
          getListeningHistory(20, 1),
        ]);

        setRecentTracks(recent);
        setHistoryTracks(history);
      } catch (error) {
        console.error("Failed to load history page:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const normalizedFilter = filter.trim().toLowerCase();

  const filteredRecent = useMemo(() => {
    if (!normalizedFilter) return recentTracks;

    return recentTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(normalizedFilter) ||
        track.artist.toLowerCase().includes(normalizedFilter)
    );
  }, [recentTracks, normalizedFilter]);

  const filteredHistory = useMemo(() => {
    if (!normalizedFilter) return historyTracks;

    return historyTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(normalizedFilter) ||
        track.artist.toLowerCase().includes(normalizedFilter)
    );
  }, [historyTracks, normalizedFilter]);

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearListeningHistory();
      setRecentTracks([]);
      setHistoryTracks([]);
    } catch (error) {
      console.error("Failed to clear listening history:", error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] px-6 pt-24 pb-8 text-white">
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
          {filteredRecent.length > 0 && (
            <RecentlyPlayedRow title="Recently played:" tracks={filteredRecent} />
          )}

          {filteredHistory.length > 0 && (
            <ListeningHistoryList tracks={filteredHistory} />
          )}

          {!filteredRecent.length && !filteredHistory.length && (
            <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
              No listening history found.
            </div>
          )}
        </>
      )}
    </div>
  );
}