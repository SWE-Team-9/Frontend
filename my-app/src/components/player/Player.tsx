"use client";

import { useEffect } from "react";
import { TrackInfo } from "./TrackInfo";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { usePlayerStore, getAudioElement } from "@/src/store/playerStore";
import { SlUserFollow } from "react-icons/sl";
import { PiQueue } from "react-icons/pi";

export function Player() {
  const {
    currentTrack,
    isPlayerVisible,
    volume,
    isProcessing,
    isResolvingPlayback,
    accessState,
    accessReason,
    streamError,
  } = usePlayerStore();

  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;

    const onError = () =>
      usePlayerStore.setState({
        isPlaying: false,
        streamError: "Audio playback failed.",
      });

    const onWaiting = () => console.log("Buffering...");
    const onPlaying = () => console.log("Playing smoothly");

    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  if (!isPlayerVisible || !currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#333] border-t border-[#222] shadow-2xl h-[60px] flex items-center">
      <div className="flex items-center w-full px-4 gap-6">
        <div className="flex items-center gap-4 flex-1">
          <PlayerControls />

          <div className="flex flex-col flex-1 max-w-2xl relative">
            <ProgressBar />

            <div className="absolute -top-4 left-0 w-full flex justify-center pointer-events-none gap-2">
              {isResolvingPlayback && !streamError && (
                <p className="text-[9px] text-zinc-400">Loading track...</p>
              )}
              {isProcessing && (
                <p className="text-[9px] text-yellow-400">Track is still processing...</p>
              )}
              {accessState === "BLOCKED" && (
                <p className="text-[9px] text-red-400">
                  {accessReason || "This track is unavailable."}
                </p>
              )}
              {accessState === "PREVIEW" && (
                <p className="text-[9px] text-orange-400">Preview mode</p>
              )}
              {streamError && accessState !== "BLOCKED" && (
                <p className="text-[9px] text-red-400">{streamError}</p>
              )}
              {!streamError && isResolvingPlayback && (
                <p className="text-[9px] text-zinc-500">Connecting to server...</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <VolumeControl />
          <TrackInfo />

          <div className="flex items-center gap-3 ml-2 text-zinc-400">
            <button className="hover:text-white transition-colors">
              <SlUserFollow />
            </button>
            <button className="hover:text-white transition-colors">
              <PiQueue />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}