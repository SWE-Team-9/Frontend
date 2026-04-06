"use client";

import RecentlyPlayedSection from "@/src/components/discover/RecentlyPlayedSection";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">More of What You Like</h1>
      <RecentlyPlayedSection />
    </div>
  );
}