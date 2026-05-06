"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlaylist } from "@/src/hooks/usePlaylist";
import { TrackList } from "@/src/components/playlists/TrackList";
import { AddTrackModal } from "@/src/components/playlists/AddTrackModal";
import SharePopup from "@/src/components/share/SharePopup";
import { EmbedModal } from "@/src/components/playlists/EmbedModal";
import { usePlayerStore } from "@/src/store/playerStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { buildPlaylistPermalink } from "@/src/lib/permalinks";
import { playlistsApi } from "@/src/services/playlistsService";

import {
  FaMusic,
  FaLock,
  FaGlobeAmericas,
  FaPlus,
  FaShare,
  FaCode,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";

interface Track {
  trackId: string;
  title: string;
  artist?: string;
  artistHandle?: string;
  cover?: string;
  duration?: number;
  likesCount?: number;
  repostsCount?: number;
}

const DEFAULT_GRADIENT_CLASS =
  "bg-linear-to-r from-[#8D8284] via-[#89747C] to-[#866975]";

async function extractGradientFromImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/next/extract-colors?imageUrl=${encodeURIComponent(src)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { gradient: string | null };
    return data.gradient ?? null;
  } catch {
    return null;
  }
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { playlist, isLoading, addTrack, removeTrack, reorderTracks } =
    usePlaylist(id);
  const viewer = useAuthStore((s) => s.user);

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [dynamicGradient, setDynamicGradient] = useState<string | null>(null);

  // Optimistic like override — null means "use server value from playlist"
  const [likedOverride, setLikedOverride] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  // Derive liked/likesCount: optimistic override takes priority, falls back to server value
  const liked = likedOverride?.liked ?? playlist?.liked;
  const likesCount = likedOverride?.count ?? playlist?.likesCount;

  const isOwner = useMemo(() => {
    if (!viewer || !playlist) return false;
    const ownerId = playlist.owner?.id;
    if (ownerId && viewer.id) return String(ownerId) === String(viewer.id);
    const ownerHandle = playlist.owner?.handle ?? playlist.handle ?? null;
    if (ownerHandle && viewer.handle) return ownerHandle === viewer.handle;
    return false;
  }, [viewer, playlist]);

  const toggleLike = useCallback(async () => {
    if (!playlist || isLiking || isOwner) return;
    setIsLiking(true);
    try {
      if (liked) {
        await playlistsApi.unlikePlaylist(playlist.playlistId);
        setLikedOverride({
          liked: false,
          count: Math.max(0, (likesCount ?? 0) - 1),
        });
      } else {
        await playlistsApi.likePlaylist(playlist.playlistId);
        setLikedOverride({
          liked: true,
          count: (likesCount ?? 0) + 1,
        });
      }
    } catch {
      // State is only set after a successful await — nothing to revert
    } finally {
      setIsLiking(false);
    }
  }, [playlist, liked, likesCount, isLiking, isOwner]);

  const setPlayerTracks = usePlayerStore((s) => s.setTracks);

  const tracks: Track[] = useMemo(() => {
    if (!playlist?.tracks?.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (playlist.tracks as any[]).map((t) => ({
      trackId: String(t.trackId ?? t.id ?? ""),
      title: String(t.title ?? "Untitled"),
      artist:
        t.artist?.name ??
        (typeof t.artist === "string" ? t.artist : undefined) ??
        t.artistName ??
        undefined,
      artistHandle: t.artist?.handle ?? t.artistHandle ?? undefined,
      cover: t.coverArtUrl ?? t.cover ?? undefined,
      duration: t.durationMs ? Math.floor(t.durationMs / 1000) : undefined,
      likesCount: t.likesCount,
      repostsCount: t.repostsCount,
    }));
  }, [playlist]);

  useEffect(() => {
    if (!tracks.length) return;
    setPlayerTracks(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (playlist!.tracks as any[]).map((t) => ({
        trackId: String(t.trackId ?? t.id ?? ""),
        title: String(t.title ?? "Untitled"),
        artist:
          t.artist?.name ??
          (typeof t.artist === "string" ? t.artist : undefined) ??
          t.artistName ??
          "Unknown Artist",
        artistId: t.artist?.id ?? t.artistId ?? "",
        artistHandle: t.artist?.handle ?? t.artistHandle ?? undefined,
        artistAvatarUrl: t.artistAvatarUrl ?? null,
        cover: t.coverArtUrl ?? t.cover ?? "/images/track-placeholder.png",
      })),
    );
  }, [tracks, setPlayerTracks, playlist]);

  useEffect(() => {
    let cancelled = false;
    if (!playlist?.cover) {
      void Promise.resolve().then(() => {
        if (!cancelled) setDynamicGradient(null);
      });
      return () => {
        cancelled = true;
      };
    }
    extractGradientFromImage(playlist.cover).then((gradient) => {
      if (!cancelled) setDynamicGradient(gradient);
    });
    return () => {
      cancelled = true;
    };
  }, [playlist?.cover]);

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
    playlist.visibility === "SECRET" ? FaLock : FaGlobeAmericas;

  const sharePermalink = buildPlaylistPermalink({
    playlistId: playlist.playlistId,
    ownerHandle: playlist.handle ?? playlist.owner?.handle ?? null,
    slug: playlist.slug ?? null,
  });

  const ownerName =
    playlist.owner?.displayName ?? playlist.owner?.display_name ?? "You";

  const ownerHref = playlist.owner?.handle
    ? `/profiles/${playlist.owner.handle}`
    : null;

  const formattedRelease = formatDate(playlist.releaseDate);
  const visibilityLabel =
    playlist.visibility === "SECRET" ? "Private" : "Public";

  const displayTracksCount = playlist.tracksCount ?? tracks.length;

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32">
      {/* Header */}
      <div
        className={
          dynamicGradient
            ? "px-6 py-10"
            : `${DEFAULT_GRADIENT_CLASS} px-6 py-10`
        }
        style={dynamicGradient ? { background: dynamicGradient } : undefined}
      >
        <div className="flex flex-col md:flex-row gap-6 max-w-5xl">
          {/* Info — left on desktop */}
          <div className="flex-1 flex flex-col justify-end order-last md:order-first">
            {/* Visibility + genre badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                <VisibilityIcon size={9} />
                {visibilityLabel} Playlist
              </span>
              {playlist.genre && (
                <span className="text-[10px] font-bold uppercase text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded tracking-wider">
                  {playlist.genre}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {playlist.title}
            </h1>

            {playlist.description && (
              <p className="text-zinc-300 text-sm mb-4">
                {playlist.description}
              </p>
            )}

            {/* Meta line: owner · tracks · likes · release date */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4 flex-wrap">
              {ownerHref ? (
                <Link
                  href={ownerHref}
                  className="hover:text-white transition-colors"
                >
                  {ownerName}
                </Link>
              ) : (
                <span>{ownerName}</span>
              )}
              <span>·</span>
              <span>{displayTracksCount} tracks</span>
              {likesCount !== undefined && (
                <>
                  <span>·</span>
                  <span>{likesCount.toLocaleString()} likes</span>
                </>
              )}
              {formattedRelease && (
                <>
                  <span>·</span>
                  <span>{formattedRelease}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-3">
              {!isOwner && liked !== undefined && (
                <button
                  onClick={toggleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2.5 text-md font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50
                    ${
                      liked
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                >
                  {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                  {liked ? "Liked" : "Like"}
                </button>
              )}

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

          {/* Cover — right on desktop, top on mobile */}
          <div className="relative w-full md:w-48 h-48 rounded-md overflow-hidden bg-[#222] shadow-2xl shrink-0 order-first md:order-last">
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
          permalink={sharePermalink}
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