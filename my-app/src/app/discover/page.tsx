"use client";

import RecentlyPlayedSection from "@/src/components/discover/RecentlyPlayedSection";
import TrendingSection from "@/src/components/discover/TrendingSection";
import TrendingByGenreSection from "@/src/components/discover/TrendingByGenreSection";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">More of What You Like</h1>

      <RecentlyPlayedSection />
      <TrendingSection />
      <TrendingByGenreSection />
    </div>
  );
}