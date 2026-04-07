"use client";

import Image from "next/image";
import { FaPlay, FaPause, FaHeart } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { BiRepost } from "react-icons/bi";
import { FiShare } from "react-icons/fi";
import { TbCopy } from "react-icons/tb";
import { usePlayerStore } from "@/src/store/playerStore";
import { ListeningHistoryItem } from "@/src/types/history";
import { useState } from "react";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";

const FALLBACK_IMAGE = "/images/track-placeholder.png";
const ACCENT = "#ff5500";

interface HistoryTrackRowProps {
  track: ListeningHistoryItem;
}

function formatTime(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function HistoryTrackRow({ track }: HistoryTrackRowProps) {
  const [liked, setLiked] = useState(false);
  const {
    currentTrack,
    isPlaying,
    toggle,
    fetchAndPlay,
    currentTime,
    duration,
    seekTo,
  } = usePlayerStore();

  const isCurrent = currentTrack?.trackId === track.trackId;
  const waveformProgress =
    isCurrent && duration > 0 ? currentTime / duration : 0;

  const handlePlay = () => {
    if (isCurrent) {
      toggle();
      return;
    }

    fetchAndPlay({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      artistId: track.artistId,
      artistHandle: track.artistHandle,
      artistAvatarUrl: track.artistAvatarUrl ?? null,
      cover: track.coverArtUrl || FALLBACK_IMAGE,
    });
  };

  const handleWaveformSeek = async (progress: number) => {
    if (!isCurrent || duration <= 0) return;

    const nextTime = progress * duration;
    await seekTo(nextTime);
  };


  return (
    <div className="mb-10 flex gap-5">
      <div className="relative h-[150px] w-[150px] shrink-0 overflow-hidden rounded-sm bg-zinc-900">
        <Image
          src={track.coverArtUrl || FALLBACK_IMAGE}
          alt={track.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-start gap-4">
          <button
            onClick={handlePlay}
            className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity hover:opacity-80"
          >
            {isCurrent && isPlaying ? (
              <FaPause className="text-xl" />
            ) : (
              <FaPlay className="ml-1 text-xl" />
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-[20px] font-semibold text-white">
              {track.artist}
            </p>
            <p className="truncate text-[24px] font-bold text-white">
              {track.title}
            </p>
          </div>
        </div>

        <div className="mb-5 h-[80px] w-full">
          <WaveformDisplay
            seed={track.trackId}
            progress={waveformProgress}
            onSeek={isCurrent ? handleWaveformSeek : undefined}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiked((prev) => !prev)}
            className="flex items-center gap-2 rounded bg-zinc-800 px-4 py-2 text-white transition hover:opacity-80"
          >
            <FaHeart style={{ color: liked ? ACCENT : "#ffffff" }} />
          </button>

          <button className="rounded bg-zinc-800 px-4 py-2 text-white transition hover:opacity-80">
            <BiRepost />
          </button>

          <button className="rounded bg-zinc-800 px-4 py-2 text-white transition hover:opacity-80">
            <FiShare />
          </button>

          <button className="rounded bg-zinc-800 px-4 py-2 text-white transition hover:opacity-80">
            <TbCopy />
          </button>

          <button className="rounded bg-zinc-800 px-4 py-2 text-white transition hover:opacity-80">
            <HiDotsHorizontal />
          </button>

          <div className="ml-auto text-sm text-zinc-400">
            {formatTime(track.durationSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
}