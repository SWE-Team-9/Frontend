"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TrackDetails, getUserTracks, deleteTrack } from "@/src/services/uploadService";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import DeleteTrackModal from "@/src/components/tracks/DeleteTrackModal";
import { useRepostStore } from "@/src/store/repostStore";
import { usePlayerStore, type Track as PlayerTrack } from "@/src/store/playerStore";
import { getUserReposts } from "@/src/services/repostService";
interface TrackListProps {
  userId: string;
  type?: "tracks" | "reposts" | "all";
  isOwner?: boolean;
}

function getArtistLabel(value: unknown): string {
  if (typeof value === "string") return value;

  if (
    value &&
    typeof value === "object" &&
    "displayName" in value &&
    typeof (value as { displayName?: unknown }).displayName === "string"
  ) {
    return (value as { displayName: string }).displayName;
  }

  return "Unknown Artist";
}

const TrackList: React.FC<TrackListProps> = ({ userId, type = "tracks", isOwner = false }) => {
  const [tracks, setTracks] = useState<TrackDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get repost state from store
  const { isReposted, repostedTracks } = useRepostStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const setPlayerTracks = usePlayerStore((state) => state.setTracks);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<{ id: string; title: string } | null>(null);

  const mappedPlayerTracks = useMemo<PlayerTrack[]>(() => {
    return tracks.map((track) => ({
      trackId: track.trackId,
      title: track.title,
      artist: getArtistLabel(track.artist),
      artistId: track.artistId || userId,
      artistHandle: track.artistHandle ?? undefined,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
      cover: track.coverArtUrl || "/images/track-placeholder.png",
      duration: track.durationMs ? Math.floor(track.durationMs / 1000) : undefined,
      genre: track.genre ?? undefined,
    }));
  }, [tracks, userId]);

  useEffect(() => {
    setPlayerTracks(mappedPlayerTracks);
  }, [mappedPlayerTracks, setPlayerTracks]);

  // Re-run if type changes or if the size of reposts changes
  useEffect(() => {
    const loadTracks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setActionError(null);
        if (type === "reposts") {
        if (isOwner) {
          // 1. On YOUR profile: Use your local Zustand store (repostedTracks)
          // This ensures instant updates when you click the repost button.
          setTracks(repostedTracks as unknown as TrackDetails[]);
          
        } else {
          // 2. On OTHERS' profiles: Use the API service to fetch THEIR data
          // We call your service which handles the backend mapping.
          
          const remoteData = await getUserReposts(userId) as unknown as TrackDetails[];
          setTracks(remoteData);
        }
      } else {
        // 3. Standard "All/Tracks" tab: Fetch this user's uploads
        const data = await getUserTracks(userId);
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error("Load tracks failed:", err);
      setTracks([]);
      setError("Failed to load tracks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  loadTracks();
  // We include repostedTracks.length to refresh the list instantly 
  // if you repost/unrepost a track while looking at your own list.
}, [userId, type, isOwner, repostedTracks.length]);

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
              key={track.trackId}
              track={{
                ...track,
                trackId: track.trackId,
                title: track.title,
                artist: track.artist,
                artistId: track.artistId || userId,
                artistHandle: track.artistHandle ?? undefined,
                artistAvatarUrl: track.artistAvatarUrl ?? null,
                coverArtUrl: track.coverArtUrl ?? undefined,
                durationMs: track.durationMs,
                genre: track.genre ?? undefined,
              }}
              isOwner={isOwner}
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
