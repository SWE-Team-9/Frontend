"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaVolumeUp, FaVolumeDown, FaVolumeMute } from "react-icons/fa";
import { useState } from "react";

export function VolumeControl() {
  const { volume, setVolume } = usePlayerStore();
  const [prevVolume, setPrevVolume] = useState(75);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0); // store.setVolume already normalizes to 0–1 for audio element
    } else {
      setVolume(prevVolume);
    }
  };

  const VolumeIcon = volume === 0 ? FaVolumeMute : volume < 50 ? FaVolumeDown : FaVolumeUp;

  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="text-[#999] hover:text-white transition-colors p-1"
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <VolumeIcon size={14} />
      </button>
      <div
        className="relative w-20 h-1 bg-[#333] rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          setVolume(Math.round(ratio * 100)); // setVolume handles the /100 normalization internally
        }}
      >
        <div
          className="h-full bg-[#999] group-hover:bg-[#f50] rounded-full relative transition-colors"
          style={{ width: `${volume}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}