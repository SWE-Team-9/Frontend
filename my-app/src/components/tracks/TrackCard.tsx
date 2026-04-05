"use client";

import React, { useState } from "react";
import { TrackDetails, changeTrackVisibility } from "@/src/services/uploadService";
import { Edit2, Trash2, Play, Eye, EyeOff } from "lucide-react";

interface TrackCardProps {
  track: TrackDetails;
  onEdit: (track: TrackDetails) => void;
  onDelete: (id: string, title: string) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onEdit, onDelete }) => {
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    track.visibility
  );
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setIsTogglingVisibility(true);
    try {
      await changeTrackVisibility(track.trackId, newVisibility);
      setVisibility(newVisibility);
    } catch (err) {
      console.error("Failed to toggle visibility", err);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-5 items-start hover:bg-[#252525] transition-colors">
      {/* Cover art placeholder */}
      <div className="w-32 h-32 bg-[#333] rounded-md shrink-0 flex items-center justify-center">
        {track.coverArtUrl ? (
          <img
            src={track.coverArtUrl}
            alt={track.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-[#2a2a2a] rounded-md animate-pulse" />
        )}
      </div>

      {/* Track info */}
      <div className="grow flex flex-col gap-3 min-w-0">
        {/* Title row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shrink-0">
              <Play className="w-5 h-5 fill-black" />
            </button>
            <div className="truncate">
              <h4 className="text-white text-lg font-bold truncate">
                {track.title}
              </h4>
              {track.genre && (
                <p className="text-zinc-400 text-sm">{track.genre}</p>
              )}
            </div>
          </div>

          {/* Visibility badge */}
          <span
            className={`text-xs font-semibold px-2 py-1 rounded shrink-0 ${
              visibility === "PUBLIC"
                ? "bg-green-900/40 text-green-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {visibility}
          </span>
        </div>

        {/* Waveform / status area */}
        <div className="w-full h-14 bg-zinc-800/50 rounded flex items-center justify-center border border-dashed border-zinc-700">
          {track.status === "PROCESSING" ? (
            <div className="flex items-center gap-2 text-[#ff5500] animate-pulse">
              <span className="w-2 h-2 bg-[#ff5500] rounded-full animate-bounce" />
              <p className="text-xs font-bold uppercase italic">
                Processing...
              </p>
            </div>
          ) : (
            <p className="text-zinc-600 text-xs italic">Waveform ready</p>
          )}
        </div>

        {/* Tags */}
        {track.tags && track.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {track.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1">
          {/* Toggle Visibility */}
          <button
            onClick={handleToggleVisibility}
            disabled={isTogglingVisibility}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a] text-xs font-medium transition disabled:opacity-50"
            title="Toggle visibility"
          >
            {visibility === "PUBLIC" ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {visibility === "PUBLIC" ? "Make Private" : "Make Public"}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(track)}
            className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a] transition"
            title="Edit track"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(track.trackId, track.title)}
            className="p-2 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20 transition"
            title="Delete track"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
