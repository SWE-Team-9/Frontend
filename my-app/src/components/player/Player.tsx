"use client";

import { useEffect } from "react";
import { TrackInfo } from "./TrackInfo";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { usePlayerStore, getAudioElement } from "@/src/store/playerStore";

export function Player() {
  const { setCurrentTime, setDuration, nextTrack, pause, volume, isProcessing, accessState, streamError } =
    usePlayerStore();

  //  sync audio element events → store (replaces the fake interval)
  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;

    // set initial volume (0–100 → 0–1)
    audio.volume = volume / 100;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration ?? 0);  
    const onEnded = () => nextTrack();
    const onPause = () => pause();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
    };
  }, []);  // runs once — audio element is a singleton

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-[#222] shadow-2xl">
      <div className="flex items-center px-4 py-2 gap-4 max-w-screen-2xl mx-auto">
        <TrackInfo />

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 max-w-lg mx-auto">
          <PlayerControls />
          <ProgressBar />

          {/* processing indicator */}
          {isProcessing && (
            <p className="text-[10px] text-yellow-400 mt-0.5">Track is still processing...</p>
          )}

          {/* blocked access */}
          {accessState === "BLOCKED" && (
            <p className="text-[10px] text-red-400 mt-0.5">This track is not available in your region.</p>
          )}

          {/* Stream error */}
          {streamError && (
            <p className="text-[10px] text-red-400 mt-0.5">{streamError}</p>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0 justify-end flex-1 max-w-xs">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}