"use client";

// React hooks + Next.js dynamic route params
import { use, useState } from "react";

// Next Image optimization
import Image from "next/image";

// Custom hook to manage playlist data + actions (add/remove/reorder)
import { usePlaylist } from "@/src/hooks/usePlaylist";

// Component to render list of tracks inside playlist
import { TrackList } from "@/src/components/playlists/TrackList";

// Modal for searching and adding tracks
import { AddTrackModal } from "@/src/components/playlists/AddTrackModal";

// Modal for sharing playlist link
import { ShareModal } from "@/src/components/playlists/ShareModal";

// Modal for embedding playlist
import { EmbedModal } from "@/src/components/playlists/EmbedModal";

// Icons used in UI
import {
  FaPlay,
  FaMusic,
  FaLock,
  FaGlobeAmericas,
  FaPlus,
  FaShare,
  FaCode,
} from "react-icons/fa";

// Playlist detail page component (dynamic route)
export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  // Extract playlist id from route params
  const { id } = use(params);

  // Playlist state + API actions from custom hook
  const { playlist, isLoading, addTrack, removeTrack, reorderTracks } =
    usePlaylist(id);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  // Loading state UI
  if (isLoading) {
    return <p className="text-center text-zinc-500 py-20">Loading...</p>;
  }

  // If playlist not found
  if (!playlist) {
    return <p className="text-center text-zinc-500 py-20">Playlist not found</p>;
  }

  // Choose icon based on playlist visibility
  const VisibilityIcon =
    playlist.visibility === "PRIVATE" ? FaLock : FaGlobeAmericas;

  return (
    // Page wrapper
    <div className="-mx-6">

      {/* Header section with gradient background */}
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-10">

        <div className="flex flex-col md:flex-row gap-6 max-w-5xl">

          {/* Playlist cover image */}
          <div className="relative w-full md:w-48 h-48 rounded-md overflow-hidden bg-[#222] shadow-2xl flex-shrink-0">

            {playlist.cover ? (
              <Image
                src={playlist.cover}
                alt={playlist.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              // Fallback icon if no cover exists
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
                <FaMusic className="text-zinc-600 text-5xl" />
              </div>
            )}
          </div>

          {/* Playlist info section */}
          <div className="flex-1 flex flex-col justify-end">

            {/* Visibility badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400 mb-2 tracking-wider">
              <VisibilityIcon size={9} />
              {playlist.visibility} Playlist
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {playlist.title}
            </h1>

            {/* Description */}
            {playlist.description && (
              <p className="text-zinc-300 text-sm mb-4">{playlist.description}</p>
            )}

            {/* Owner + track count */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4">
              <span>{playlist.owner?.display_name ?? "You"}</span>
              <span>·</span>
              <span>{playlist.tracksCount ?? 0} tracks</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center flex-wrap gap-3">

              {/* Play button */}
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors">
                <FaPlay size={11} /> Play
              </button>

              {/* Open add track modal */}
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaPlus size={11} /> Add Track
              </button>

              {/* Open share modal */}
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaShare size={11} /> Share
              </button>

              {/* Open embed modal */}
              <button
                onClick={() => setEmbedOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                <FaCode size={11} /> Embed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track list section */}
      <div className="py-8 max-w-5xl px-6">
        <TrackList
          tracks={playlist.tracks ?? []}
          canEdit

       

          onRemove={async (trackId) => {
            try {
              await removeTrack(trackId);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Could not remove");
            }
          }}

         
          onReorder={async (ids) => {
            try {
              await reorderTracks(ids);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Could not reorder");
            }
          }}
        />
      </div>

      {/* Modals */}
      <AddTrackModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addTrack}
      />

      <ShareModal
        playlist={playlist}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <EmbedModal
        playlistId={playlist.playlistId}
        isOpen={embedOpen}
        onClose={() => setEmbedOpen(false)}
      />
    </div>
  );
}