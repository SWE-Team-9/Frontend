"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MdShuffle, MdRepeat } from "react-icons/md";

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
    isShuffleOn,
    loopMode,
    toggleShuffle,
    cycleLoopMode,
  } = usePlayerStore();

  const isPlayDisabled =
    !currentTrack ||
    accessState === "BLOCKED" ||
    isProcessing ||
    isResolvingPlayback;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleShuffle}
        className={`hidden sm:flex p-1.5 rounded transition-colors ${
          isShuffleOn ? "text-[#f50]" : "text-[#999] hover:text-white"
        }`}
        title={isShuffleOn ? "Turn shuffle off" : "Turn shuffle on"}
      >
        <MdShuffle size={18} />
      </button>

      <button
        type="button"
        onClick={previousTrack}
        disabled={!currentTrack}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FaStepBackward size={16} />
      </button>

      <button
        type="button"
        onClick={toggle}
        disabled={isPlayDisabled}
        className="w-9 h-9 rounded-full bg-white hover:bg-[#f0f0f0] active:scale-95 flex items-center justify-center text-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={nextTrack}
        disabled={!currentTrack}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FaStepForward size={16} />
      </button>

      <button
        type="button"
        onClick={cycleLoopMode}
        className={`relative hidden sm:flex p-1.5 rounded transition-colors ${
          loopMode !== "OFF" ? "text-[#f50]" : "text-[#999] hover:text-white"
        }`}
        title={
          loopMode === "OFF"
            ? "Loop off"
            : loopMode === "ALL"
              ? "Loop all tracks"
              : "Repeat current track"
        }
      >
        <MdRepeat size={18} />
        {loopMode === "ONE" && (
          <span className="absolute -top-1 -right-1 text-[9px] font-bold leading-none">
            1
          </span>
        )}
      </button>
    </div>
  );
}