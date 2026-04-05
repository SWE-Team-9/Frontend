"use client";

import { useEffect, useState } from "react";
import LibraryTabs from "@/src/components/library/LibraryTabs";
import RecentlyPlayedRow from "@/src/components/library/RecentlyPlayedRow";
import { RecentlyPlayedItem } from "@/src/types/history";
import { getRecentlyPlayed } from "@/src/services/historyService";

export default function LibraryOverviewPage() {
  const [tracks, setTracks] = useState<RecentlyPlayedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRecentlyPlayed(6, 1);
        setTracks(data);
      } catch (error) {
        console.error("Failed to load overview recent tracks:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] px-6 pt-24 pb-8 text-white">
      <LibraryTabs />

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : tracks.length ? (
        <RecentlyPlayedRow title="Recently played" tracks={tracks} />
      ) : (
        <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
          Start playing tracks and they’ll appear here.
        </div>
      )}
    </div>
  );
}