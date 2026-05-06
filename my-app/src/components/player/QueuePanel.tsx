"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaTrash, FaArrowUp, FaArrowDown, FaTimes } from "react-icons/fa";
import {
  getQueueState,
  type QueueTrackMetadata,
} from "@/src/services/playerService";
import { usePlayerStore } from "@/src/store/playerStore";

interface QueuePanelProps {
  onClose: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const {
    currentQueueIndex,
    queueLength,
    isQueuePanelOpen,
    queueVersion,
    jumpToTrackInQueue,
    removeTrackFromQueue,
    moveTrackInQueue,
    clearBackendQueue,
  } = usePlayerStore();

  const [tracks, setTracks] = useState<QueueTrackMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshQueue = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const resp = await getQueueState();
      setTracks(resp.queue);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isQueuePanelOpen) return;

    const timer = window.setTimeout(() => {
      void refreshQueue(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isQueuePanelOpen, queueVersion]);

  if (!isQueuePanelOpen) return null;

  const handleJump = async (trackId: string) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      await jumpToTrackInQueue(trackId);
      await refreshQueue();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (position: number) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      await removeTrackFromQueue(position);
      await refreshQueue();
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (from: number, to: number) => {
    if (actionLoading) return;
    if (to < 0 || to >= tracks.length) return;

    try {
      setActionLoading(true);
      await moveTrackInQueue(from, to);
      await refreshQueue();
    } finally {
      setActionLoading(false);
    }
  };

  const handleClear = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      await clearBackendQueue();
      setTracks([]);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        className="absolute bottom-full right-0 z-50 mb-3 flex max-h-96 w-96 flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Queue
            </h3>
            <span className="text-xs text-zinc-400">{queueLength} tracks</span>
          </div>

          <div className="flex items-center gap-2">
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={actionLoading}
                className="rounded px-2 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-950/40 disabled:opacity-50"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close queue"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
              Loading...
            </div>
          )}

          {!loading && tracks.length === 0 && (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
              No queue loaded
            </div>
          )}

          {!loading &&
            tracks.map((track, idx) => {
              const isActive = idx === currentQueueIndex;

              return (
                <div
                  key={`${track.trackId}-${idx}`}
                  className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800 ${isActive ? "bg-zinc-800/80" : ""
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => handleJump(track.trackId)}
                    disabled={actionLoading}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-zinc-700">
                      {track.cover ? (
                        <Image
                          src={track.cover}
                          alt={track.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-zinc-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className={`truncate text-sm font-medium ${isActive ? "text-[#ff5500]" : "text-white"
                          }`}
                      >
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {track.artist}
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, idx - 1)}
                      disabled={idx === 0 || actionLoading}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move up"
                    >
                      <FaArrowUp size={10} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(idx, idx + 1)}
                      disabled={idx === tracks.length - 1 || actionLoading}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move down"
                    >
                      <FaArrowDown size={10} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      disabled={actionLoading}
                      className="rounded p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-30"
                      title="Remove from queue"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>

                  {isActive && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-[#ff5500]" />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}