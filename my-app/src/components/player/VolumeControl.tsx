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
      setVolume(0);
    } else {
      setVolume(prevVolume);
    }
  };

  const VolumeIcon = volume === 0 ? FaVolumeMute : volume < 50 ? FaVolumeDown : FaVolumeUp;

  return (
    <div className="relative flex items-center justify-center group">
      {/* Vertical Slider Container (appears on hover) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center p-3 bg-[#111] border border-[#333] rounded-md shadow-xl h-32 w-10">
        
        {/* The Track */}
        <div 
          className="relative w-1 h-full bg-[#333] rounded-full cursor-pointer flex flex-col-reverse"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // Calculate ratio from bottom (0) to top (1)
            const ratio = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));
            setVolume(Math.round(ratio * 100));
          }}
        >
          {/* Active Fill */}
          <div 
            className="bg-white w-full rounded-full transition-all duration-75"
            style={{ height: `${volume}%` }}
          />
          
          {/* Thumb/Handle */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border border-gray-400 shadow-md pointer-events-none"
            style={{ bottom: `calc(${volume}% - 6px)` }}
          />
        </div>

        {/* Small Triangle Arrow at bottom */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111] border-r border-b border-[#333] rotate-45" />
      </div>

      {/* Main Icon Button */}
      <button
        onClick={toggleMute}
        className="text-[#999] hover:text-white transition-colors p-2"
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <VolumeIcon size={18} />
      </button>
    </div>
  );
}