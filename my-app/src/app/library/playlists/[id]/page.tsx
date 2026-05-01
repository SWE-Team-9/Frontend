"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePlaylist } from "@/src/hooks/usePlaylist";
import { TrackList } from "@/src/components/playlists/TrackList";
import { AddTrackModal } from "@/src/components/playlists/AddTrackModal";
import SharePopup from "@/src/components/share/SharePopup";
import { EmbedModal } from "@/src/components/playlists/EmbedModal";
import { usePlayerStore } from "@/src/store/playerStore";

import {
  FaPlay,
  FaMusic,
  FaLock,
  FaGlobeAmericas,
  FaPlus,
  FaShare,
  FaCode,
} from "react-icons/fa";

// Simple shape that TrackList / TrackItem expect
interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { playlist, isLoading, addTrack, removeTrack, reorderTracks } =
    usePlaylist(id);

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  const setPlayerTracks = usePlayerStore((s) => s.setTracks);

  // Map playlist tracks → Track shape for TrackList / TrackItem
  const tracks: Track[] = useMemo(() => {
    if (!playlist?.tracks?.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (playlist.tracks as any[]).map((t) => ({
      trackId: String(t.trackId ?? t.id ?? ""),
      title: String(t.title ?? "Untitled"),
      artist:
        typeof t.artist === "string"
          ? t.artist
          : (t.artistName ?? t.artist?.displayName ?? undefined),
      cover: t.coverArtUrl ?? t.cover ?? undefined,
      duration: t.durationMs ? Math.floor(t.durationMs / 1000) : undefined,
    }));
  }, [playlist?.tracks]);

  const contextTrackIds = useMemo(() => tracks.map((t) => t.trackId), [tracks]);

  // Load tracks into the global player queue
  useEffect(() => {
    if (!tracks.length) return;
    setPlayerTracks(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (playlist!.tracks as any[]).map((t) => ({
        trackId: String(t.trackId ?? t.id ?? ""),
        title: String(t.title ?? "Untitled"),
        artist:
          typeof t.artist === "string"
            ? t.artist
            : (t.artistName ?? t.artist?.displayName ?? "Unknown Artist"),
        artistId: t.artistId ?? "",
        artistHandle: t.artistHandle ?? undefined,
        artistAvatarUrl: t.artistAvatarUrl ?? null,
        cover: t.coverArtUrl ?? t.cover ?? "/images/track-placeholder.png",
      })),
    );
  }, [tracks, setPlayerTracks, playlist]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse uppercase tracking-widest text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500">Playlist not found.</p>
      </div>
    );
  }

  const VisibilityIcon =
    playlist.visibility === "PRIVATE" ? FaLock : FaGlobeAmericas;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-linear-to-r from-[#8D8284] via-[#89747C] to-[#866975] px-6 py-10">
        <div className="flex flex-col md:flex-row gap-6 max-w-5xl">
          {/* Cover */}
          <div className="relative w-full md:w-48 h-48 rounded-md overflow-hidden bg-[#222] shadow-2xl shrink-0">
            {playlist.cover ? (
              <Image
                src={playlist.cover}
                alt={playlist.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#333] to-[#1a1a1a]">
                <FaMusic className="text-zinc-600 text-5xl" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400 mb-2 tracking-wider">
              <VisibilityIcon size={9} />
              {playlist.visibility} Playlist
            </span>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {playlist.title}
            </h1>

            {playlist.description && (
              <p className="text-zinc-300 text-sm mb-4">
                {playlist.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4">
              <span>{playlist.owner?.display_name ?? "You"}</span>
              <span>·</span>
              <span>{tracks.length} tracks</span>
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-md font-bold uppercase tracking-wider rounded transition-colors">
                <FaPlay size={15} /> Play
              </button>

              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-md font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaPlus size={15} /> Add Track
              </button>

              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-md font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaShare size={15} /> Share
              </button>

              <button
                onClick={() => setEmbedOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-md font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaCode size={15} /> Embed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="max-w-5xl px-6 py-8">
        <TrackList
          tracks={tracks}
          canEdit={true}
          onRemove={removeTrack}
          onReorder={reorderTracks}
        />

        {tracks.length === 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-md font-bold uppercase tracking-wider rounded transition-colors"
            >
              <FaPlus size={15} /> Add your first track
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTrackModal
        key={addOpen ? "open" : "closed"}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addTrack}
      />

      {shareOpen && (
        <SharePopup
          permalink={`/playlists/${playlist.playlistId}`}
          onClose={() => setShareOpen(false)}
          resourceType="PLAYLIST"
          resourceId={playlist.playlistId}
          resourceTitle={playlist.title}
          resourceCoverArtUrl={playlist.cover ?? null}
        />
      )}

      <EmbedModal
        playlistId={playlist.playlistId}
        isOpen={embedOpen}
        onClose={() => setEmbedOpen(false)}
      />
    </div>
  );
}
