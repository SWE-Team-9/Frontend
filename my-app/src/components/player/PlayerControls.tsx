"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MdShuffle, MdRepeat } from "react-icons/md";
import { useState } from "react";

export function PlayerControls() {
  const {
    currentTrack,
    isPlaying,
    toggle,
    nextTrack,
    previousTrack,
    accessState,
    isProcessing,
    isResolvingPlayback,
  } = usePlayerStore();

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const isPlayDisabled =
    !currentTrack ||
    accessState === "BLOCKED" ||
    isProcessing ||
    isResolvingPlayback;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShuffle((s) => !s)}
        className={`hidden sm:flex p-1.5 rounded transition-colors ${shuffle ? "text-[#f50]" : "text-[#999] hover:text-white"
          }`}
      >
        <MdShuffle size={18} />
      </button>

      <button
        onClick={previousTrack}
        disabled={!currentTrack}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FaStepBackward size={16} />
      </button>

      <button
        onClick={toggle}
        disabled={isPlayDisabled}
        className="w-9 h-9 rounded-full bg-white hover:bg-[#f0f0f0] active:scale-95 flex items-center justify-center text-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
      </button>

      <button
        onClick={nextTrack}
        disabled={!currentTrack}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FaStepForward size={16} />
      </button>

      <button
        onClick={() => setRepeat((r) => !r)}
        className={`hidden sm:flex p-1.5 rounded transition-colors ${repeat ? "text-[#f50]" : "text-[#999] hover:text-white"
          }`}
      >
        <MdRepeat size={18} />
      </button>
    </div>
  );
}