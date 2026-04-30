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
    isPlayingAd,
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
        disabled={isPlayingAd}
        className={`hidden sm:flex p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          isShuffleOn && !isPlayingAd ? "text-[#f50]" : "text-[#999] hover:text-white"
        }`}
        title={isPlayingAd ? "Cannot shuffle during an ad" : isShuffleOn ? "Turn shuffle off" : "Turn shuffle on"}
      >
        <MdShuffle size={18} />
      </button>

      <button
        type="button"
        onClick={previousTrack}
        disabled={!currentTrack || isPlayingAd}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={isPlayingAd ? "Cannot skip during an ad" : undefined}
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
        disabled={!currentTrack || isPlayingAd}
        className="p-1.5 text-[#ccc] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={isPlayingAd ? "Cannot skip during an ad" : undefined}
      >
        <FaStepForward size={16} />
      </button>

      <button
        type="button"
        onClick={cycleLoopMode}
        disabled={isPlayingAd}
        className={`relative hidden sm:flex p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          loopMode !== "OFF" && !isPlayingAd ? "text-[#f50]" : "text-[#999] hover:text-white"
        }`}
        title={
          isPlayingAd
            ? "Cannot change loop mode during an ad"
            : loopMode === "OFF"
              ? "Loop off"
              : loopMode === "ALL"
                ? "Loop all tracks"
                : "Repeat current track"
        }
      >
        <MdRepeat size={18} />
        {loopMode === "ONE" && !isPlayingAd && (
          <span className="absolute -top-1 -right-1 text-[9px] font-bold leading-none">
            1
          </span>
        )}
      </button>
    </div>
  );
}