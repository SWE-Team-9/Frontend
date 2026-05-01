"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getQueueState,
  jumpToQueueTrack,
  type QueueTrackMetadata,
} from "@/src/services/playerService";
import { usePlayerStore } from "@/src/store/playerStore";
import type { Track } from "@/src/store/playerStore";

export function QueuePanel() {
  const { currentQueueIndex, queueLength, isQueuePanelOpen, toggleQueuePanel, queueVersion } =
    usePlayerStore();
  const [tracks, setTracks] = useState<QueueTrackMetadata[]>([]);
  // Start as true: the panel is always visible when this component mounts,
  // so the first render is always a loading state. Subsequent refreshes
  // (queueVersion change) update silently without a spinner.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isQueuePanelOpen) return;
    getQueueState()
      .then((resp) => { setTracks(resp.queue); setLoading(false); })
      .catch(() => { setTracks([]); setLoading(false); });
  }, [isQueuePanelOpen, queueVersion]);

  if (!isQueuePanelOpen) return null;

  const handleJump = async (trackId: string) => {
    try {
      const resp = await jumpToQueueTrack(trackId);
      if (resp.type !== "TRACK") return;

      const meta = resp.track;
      const track: Track = {
        trackId: meta.trackId,
        title: meta.title,
        artist: meta.artist,
        artistId: meta.artistId,
        artistHandle: meta.artistHandle ?? undefined,
        artistAvatarUrl: meta.artistAvatarUrl,
        cover: meta.cover ?? "/images/track-placeholder.png",
        duration: meta.duration ?? undefined,
        genre: meta.genre ?? undefined,
      };

      const { fetchAndPlay } = usePlayerStore.getState();
      await fetchAndPlay(track, true);

      usePlayerStore.setState({
        currentQueueIndex: resp.currentIndex,
        queueLength: resp.queueLength,
        tracksUntilAd: resp.tracksUntilAd,
        currentAd: null,
        isPlayingAd: false,
      });
    } catch {
      // ignore jump errors
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={toggleQueuePanel}
      />

      {/* Panel */}
      <div className="absolute bottom-full right-0 mb-3 w-80 max-h-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Queue
          </h3>
          <span className="text-xs text-zinc-400">{queueLength} tracks</span>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
              Loading...
            </div>
          )}

          {!loading && tracks.length === 0 && (
            <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
              No queue loaded
            </div>
          )}

          {!loading &&
            tracks.map((track, idx) => {
              const isActive = idx === currentQueueIndex;
              return (
                <button
                  key={`${track.trackId}-${idx}`}
                  type="button"
                  onClick={() => handleJump(track.trackId)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left ${
                    isActive ? "bg-zinc-800/80" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded bg-zinc-700 overflow-hidden shrink-0 relative">
                    {track.cover ? (
                      <Image
                        src={track.cover}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700" />
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <p
                      className={`text-sm truncate font-medium ${
                        isActive ? "text-[#ff5500]" : "text-white"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  </div>

                  {isActive && (
                    <div className="shrink-0 w-2 h-2 rounded-full bg-[#ff5500]" />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}