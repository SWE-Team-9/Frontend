"use client";

import React, { useState, useEffect } from "react";
import { TrackDetails, getUserTracks, deleteTrack } from "@/src/services/uploadService";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import DeleteTrackModal from "@/src/components/tracks/DeleteTrackModal";
import { useRepostStore } from "@/src/store/repostStore";

interface TrackListProps {
  userId: string;
  type?: "tracks" | "reposts" | "all";
}

const TrackList: React.FC<TrackListProps> = ({ userId, type = "tracks" }) => {
  const [tracks, setTracks] = useState<TrackDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get repost state from store
  const { repostedTrackIds, hydrate } = useRepostStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<{ id: string; title: string } | null>(null);

  // Initial hydration
  useEffect(() => {
    hydrate();
  }, [hydrate]);


  // Re-run if type changes or if the size of reposts changes
  useEffect(() => {
    const loadTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setActionError(null);
      const data = await getUserTracks(userId);
      const allTracks = data.tracks || [];

      if (type === "reposts") {
        // Filter by checking if ID exists in our Repost Set
        const filtered = allTracks.filter((t: any) => 
          repostedTrackIds.has(String(t.trackId || t.id))
        );
        setTracks(filtered);
      } else {
        setTracks(allTracks);
      }
    } catch (err) {
      console.error("Load tracks failed:", err);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };
    loadTracks();
  }, [userId, type, repostedTrackIds.size]);

  const handleEdit = (track: TrackDetails) => {
    setNotice(`Edit \"${track.title}\" is not available yet.`);
    setTimeout(() => setNotice(null), 2500);
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
      setActionError(null);
      setIsDeleteModalOpen(false);
      setTrackToDelete(null);
    } catch {
      setActionError("Failed to delete the track. Please try again.");
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <p className="text-zinc-400 animate-pulse uppercase tracking-widest text-sm">Loading {type}...</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-6 bg-[#121212] rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wider">
        {type === "reposts" ? "Reposts" : "Tracks"} 
        <span className="text-zinc-500 text-lg"> ({tracks.length})</span>
      </h2>

      {notice && <p className="text-amber-400 text-sm">{notice}</p>}
      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {tracks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 italic">No {type} found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tracks.map((track) => (
            <TrackCard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
              key={track.trackId || (track as any).id}
              track={{
                ...track,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                id: track.trackId || (track as any).id,
                coverArtUrl: track.coverArtUrl ?? undefined 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any} 
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DeleteTrackModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        trackTitle={trackToDelete?.title || ""}
      />
    </div>
  );
};

export default TrackList;
