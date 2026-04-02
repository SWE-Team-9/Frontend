"use client";

import { usePlayerStore } from "@/src/store/playerStore";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MdShuffle, MdRepeat } from "react-icons/md";
import { useState } from "react";

export function PlayerControls() {
  const { isPlaying, toggle, nextTrack, previousTrack } = usePlayerStore();
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShuffle((s) => !s)}
        className={`hidden sm:flex p-1.5 rounded transition-colors ${shuffle ? "text-[#f50]" : "text-[#999] hover:text-white"}`}
      >
        <MdShuffle size={18} />
      </button>

      <button onClick={previousTrack} className="p-1.5 text-[#ccc] hover:text-white transition-colors">
        <FaStepBackward size={16} />
      </button>

      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-white hover:bg-[#f0f0f0] active:scale-95 flex items-center justify-center text-black transition-all shadow-md"
      >
        {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
      </button>

      <button onClick={nextTrack} className="p-1.5 text-[#ccc] hover:text-white transition-colors">
        <FaStepForward size={16} />
      </button>

      <button
        onClick={() => setRepeat((r) => !r)}
        className={`hidden sm:flex p-1.5 rounded transition-colors ${repeat ? "text-[#f50]" : "text-[#999] hover:text-white"}`}
      >
        <MdRepeat size={18} />
      </button>
    </div>
  );
}