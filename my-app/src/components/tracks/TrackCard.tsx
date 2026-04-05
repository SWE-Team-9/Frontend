"use client";

import React, { useState } from "react";
import { TrackDetails, changeTrackVisibility, updateTrackMetadata } from "@/src/services/uploadService";
import { Edit2, Trash2, Play, Eye, EyeOff, X, Check } from "lucide-react";

interface TrackCardProps {
  track: TrackDetails;
  onEdit?: (track: TrackDetails) => void;
  onDelete: (id: string, title: string) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onDelete }) => {
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(track.visibility);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editTitle, setEditTitle] = useState(track.title);
  const [editGenre, setEditGenre] = useState(track.genre ?? "");
  const [editTags, setEditTags] = useState(track.tags?.join(", ") ?? "");
  const [editReleaseDate, setEditReleaseDate] = useState(
    track.releaseDate?.split("T")[0] ?? ""
  );
  const [editDescription, setEditDescription] = useState(track.description ?? "");

  const [localTitle, setLocalTitle] = useState(track.title);
  const [localGenre, setLocalGenre] = useState(track.genre ?? "");
  const [localTags, setLocalTags] = useState(track.tags ?? []);

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

  const enterEdit = () => {
    setEditTitle(localTitle);
    setEditGenre(localGenre);
    setEditTags(localTags.join(", "));
    setEditReleaseDate(track.releaseDate?.split("T")[0] ?? "");
    setEditDescription(editDescription);
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTrackMetadata(track.trackId, {
        title: editTitle,
        genre: editGenre,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        releaseDate: editReleaseDate,
        description: editDescription,
      });
      setLocalTitle(editTitle);
      setLocalGenre(editGenre);
      setLocalTags(editTags.split(",").map((t) => t.trim()).filter(Boolean));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save track", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-5 items-start hover:bg-[#252525] transition-colors">
      {/* Cover art */}
      <div className="w-32 h-32 bg-[#333] rounded-md shrink-0 flex items-center justify-center">
        {track.coverArtUrl ? (
          <img src={track.coverArtUrl} alt={localTitle} className="w-full h-full object-cover rounded-md" />
        ) : (
          <div className="w-full h-full bg-[#2a2a2a] rounded-md animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="grow flex flex-col gap-3 min-w-0">
        {isEditing ? (
          /* ── EDIT MODE ── */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-widest">Title</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-[#ff5500] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Genre</label>
                <input
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-[#ff5500] transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Release Date</label>
                <input
                  type="date"
                  value={editReleaseDate}
                  onChange={(e) => setEditReleaseDate(e.target.value)}
                  className="bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-[#ff5500] transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-widest">Tags (comma separated)</label>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="pop, summer, hit"
                className="bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-[#ff5500] transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-widest">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                maxLength={5000}
                className="bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-[#ff5500] transition"
              />
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-black text-xs font-bold hover:bg-[#ff5500] hover:text-white transition disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded border border-zinc-600 text-zinc-400 text-xs font-bold hover:text-white hover:border-white transition"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shrink-0">
                  <Play className="w-5 h-5 fill-black" />
                </button>
                <div className="truncate">
                  <h4 className="text-white text-lg font-bold truncate">{localTitle}</h4>
                  {localGenre && <p className="text-zinc-400 text-sm">{localGenre}</p>}
                </div>
              </div>

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

            {/* Waveform / status */}
            <div className="w-full h-14 bg-zinc-800/50 rounded flex items-center justify-center border border-dashed border-zinc-700">
              {track.status === "PROCESSING" ? (
                <div className="flex items-center gap-2 text-[#ff5500] animate-pulse">
                  <span className="w-2 h-2 bg-[#ff5500] rounded-full animate-bounce" />
                  <p className="text-xs font-bold uppercase italic">Processing...</p>
                </div>
              ) : (
                <p className="text-zinc-600 text-xs italic">Waveform ready</p>
              )}
            </div>

            {/* Tags */}
            {localTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localTags.map((tag) => (
                  <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleToggleVisibility}
                disabled={isTogglingVisibility}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a] text-xs font-medium transition disabled:opacity-50"
              >
                {visibility === "PUBLIC" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {visibility === "PUBLIC" ? "Make Private" : "Make Public"}
              </button>

              <button
                onClick={enterEdit}
                className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a] transition"
                title="Edit track"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(track.trackId, track.title)}
                className="p-2 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20 transition"
                title="Delete track"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackCard;
