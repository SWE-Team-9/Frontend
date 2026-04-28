"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import {
  playlistsApi,
  normalizePlaylist,
  extractMessage,
} from "@/src/services/api/playlists";
import { Playlist } from "@/src/types/playlist";
import { TrackList } from "@/src/components/playlists/TrackList";
import { FaLock, FaCheckCircle, FaMusic, FaPlay } from "react-icons/fa";

export default function SecretPlaylistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await playlistsApi.getSecretPlaylist(token);
        if (!cancelled) {
          setPlaylist(normalizePlaylist(raw));
          setAccessMessage(
            extractMessage(raw) ?? "Access granted via secret token"
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Invalid or expired link"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-zinc-500">Resolving secret link...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6">
        <FaLock className="text-5xl text-zinc-700 mb-4" />
        <p className="text-red-400 font-bold">
          {error ?? "Playlist not accessible"}
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-6">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-10">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase mb-4 tracking-wider">
            <FaCheckCircle size={11} />
            <span>{accessMessage}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
                  <FaMusic className="text-zinc-600 text-5xl" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400 mb-2 tracking-wider">
                <FaLock size={9} />
                {playlist.visibility} Shared Playlist
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {playlist.title}
              </h1>
              {playlist.description && (
                <p className="text-zinc-300 text-sm mb-4">
                  {playlist.description}
                </p>
              )}
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors w-fit">
                <FaPlay size={11} /> Play
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 max-w-5xl">
        <TrackList tracks={playlist.tracks ?? []} />
      </div>
    </div>
  );
}