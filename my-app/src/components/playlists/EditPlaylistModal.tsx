"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FaTimes } from "react-icons/fa";
import { Playlist } from "@/src/types/playlist";
import { playlistsApi } from "@/src/services/api/playlists";

interface Props {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: Playlist) => void;
}

type Tab = "basic" | "tracks" | "metadata";

export function EditPlaylistModal({ playlist, isOpen, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("basic");
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    (playlist.visibility as "PUBLIC" | "PRIVATE") ?? "PUBLIC"
  );
  const [genre, setGenre] = useState("None");
  const [releaseDate, setReleaseDate] = useState("");
  const [playlistType, setPlaylistType] = useState("Playlist");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await playlistsApi.updatePlaylist(playlist.playlistId, {
        title,
        description,
        visibility,
      });
      toast.success("Playlist updated.");
      onSaved?.({ ...playlist, title, description, visibility });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update playlist");
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "block text-xs font-bold text-white mb-1.5";
  const inputCls =
    "w-full bg-[#0e0e0e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[820px] max-w-[95vw] max-h-[90vh] overflow-hidden bg-[#1a1a1a] border border-zinc-800 rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-zinc-500 hover:text-white z-10"
        >
          <FaTimes size={14} />
        </button>

        <div className="flex items-center gap-6 px-6 pt-5 border-b border-zinc-800">
          {(
            [
              ["basic", "Basic info"],
              ["tracks", "Tracks"],
              ["metadata", "Metadata"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`pb-3 text-sm font-bold ${
                tab === key
                  ? "text-white border-b-2 border-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "basic" && (
            <div className="grid grid-cols-[260px_1fr] gap-6">
              <div>
                <div className="relative aspect-square rounded bg-[#222] overflow-hidden flex items-center justify-center">
                  {playlist.cover ? (
                    <Image src={playlist.cover} alt={title} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-zinc-500 text-sm">Upload image</span>
                  )}
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs py-2 hover:bg-black/80"
                  >
                    Upload image
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Playlist type</label>
                    <select
                      value={playlistType}
                      onChange={(e) => setPlaylistType(e.target.value)}
                      className={inputCls}
                    >
                      <option>Playlist</option>
                      <option>Album</option>
                      <option>EP</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Release date</label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Genre</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className={inputCls}>
                    <option>None</option>
                    <option>Hip-Hop</option>
                    <option>Pop</option>
                    <option>Rock</option>
                    <option>Electronic</option>
                    <option>Jazz</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your playlist"
                    rows={3}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Privacy</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="radio"
                        checked={visibility === "PUBLIC"}
                        onChange={() => setVisibility("PUBLIC")}
                        className="mt-0.5 accent-[#f50]"
                      />
                      <span>
                        Public
                        <span className="block text-xs text-zinc-500">
                          Anyone will be able to listen to this playlist.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="radio"
                        checked={visibility === "PRIVATE"}
                        onChange={() => setVisibility("PRIVATE")}
                        className="mt-0.5 accent-[#f50]"
                      />
                      <span>
                        Private
                        <span className="block text-xs text-zinc-500">
                          Only you and people with the link can listen.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "tracks" && (
            <div className="text-zinc-400 text-sm">
              Reorder or remove tracks here. (Wire to your reorder/remove endpoints.)
            </div>
          )}

          {tab === "metadata" && (
            <div className="text-zinc-400 text-sm">
              Add ISRC, label, copyright, and other metadata.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white hover:bg-zinc-800 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-[#f50] text-white hover:bg-[#e64a00] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}