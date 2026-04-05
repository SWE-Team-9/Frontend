"use client";

import React, { useState, useEffect } from "react";
import { TrackDetails, getUserTracks, deleteTrack } from "@/src/services/uploadService";
import TrackCard from "@/src/components/tracks/TrackCard";
import DeleteTrackModal from "@/src/components/tracks/DeleteTrackModal";

interface TrackListProps {
  userId: string;
}

const TrackList: React.FC<TrackListProps> = ({ userId }) => {
  const [tracks, setTracks] = useState<TrackDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserTracks(userId);
      setTracks(data.tracks);
    } catch (err) {
      console.error("Failed to load tracks:", err);
      setError("Failed to load your tracks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [userId]);

  const handleEdit = (track: TrackDetails) => {
    // Edit modal integration — wire to your edit form when ready
    console.log("Edit track:", track);
    alert(`Edit "${track.title}" — connect this to your edit form.`);
  };

  const handleDeleteClick = (id: string, title: string) => {
    setTrackToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!trackToDelete) return;
    try {
      await deleteTrack(trackToDelete.id);
      setTracks((prev) =>
        prev.filter((t) => t.trackId !== trackToDelete.id)
      );
      setIsDeleteModalOpen(false);
      setTrackToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the track. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-zinc-400 animate-pulse uppercase tracking-widest text-sm">
          Loading your tracks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={loadTracks}
          className="px-4 py-2 bg-[#ff5500] text-white font-bold rounded hover:bg-orange-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-6 bg-[#121212] rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wider">
        Your Tracks{" "}
        <span className="text-zinc-500 text-lg">({tracks.length})</span>
      </h2>

      {tracks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 italic">No tracks uploaded yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.trackId}
              track={track}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DeleteTrackModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTrackToDelete(null);
        }}
        onConfirm={confirmDelete}
        trackTitle={trackToDelete?.title || ""}
      />
    </div>
  );
};

export default TrackList;
