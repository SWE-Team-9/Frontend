"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// import { getTrackDetails } from "@/src/services/uploadService";
import { getTrackDetails } from "@/src/services/uploadService.mock"; // For testing without backend

export default function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrackDetails(trackId)
      .then(setTrack)
      .finally(() => setLoading(false));
  }, [trackId]);

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (!track) return <div className="text-white p-6">Track not found.</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white p-6">
      <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
      <p className="text-gray-400 mb-1">Artist: {track.artist}</p>
      <p className="text-gray-400 mb-1">Genre: {track.genre}</p>
      <p className="text-gray-400 mb-1">Tags: {track.tags?.join(", ")}</p>
      <p className="text-gray-400 mb-1">Release Date: {track.releaseDate}</p>
      <p className="text-gray-400 mb-4">
        Visibility:{" "}
        <span className={track.visibility === "PUBLIC" ? "text-green-400" : "text-yellow-400"}>
          {track.visibility}
        </span>
      </p>

      {/* Waveform placeholder — wire up a waveform library here */}
      {track.waveformData && (
        <div className="mt-4 p-4 bg-neutral-800 rounded">
          <p className="text-sm text-gray-400">Waveform data ready ({track.waveformData.length} points)</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button className="bg-white text-black font-bold py-2 px-4 rounded hover:bg-[#ff5500] transition">
          Edit
        </button>
        <button className="border border-white text-white font-bold py-2 px-4 rounded hover:border-[#ff5500] hover:text-[#ff5500] transition">
          Change Visibility
        </button>
        <button className="bg-red-500 text-black font-bold py-2 px-4 rounded hover:bg-red-700 hover:text-white transition">
          Delete
        </button>
      </div>
    </main>
  );
}