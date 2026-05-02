"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FaTimes } from "react-icons/fa";
import { Playlist } from "@/src/types/playlist";
import { playlistsApi } from "@/src/services/playlistsService";
import DatePickerInput from "@/src/components/ui/DatePickerInput";

interface Props {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: Playlist) => void;
}

type Tab = "basic" | "tags";

export function EditPlaylistModal({
  playlist,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<Tab>("basic");
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    playlist.visibility === "SECRET" ? "PRIVATE" : "PUBLIC",
  );
  const [releaseDate, setReleaseDate] = useState(
    playlist.releaseDate?.split("T")[0] ?? "",
  );
  const [genre, setGenre] = useState(playlist.genre ?? "");
  const [tags, setTags] = useState<string[]>(playlist.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(
    playlist.cover ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    Promise.resolve()
      .then(() => setLoadingEdit(true))
      .then(() => playlistsApi.getEditDetails(playlist.playlistId))
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description ?? "");
        setVisibility(data.visibility === "SECRET" ? "PRIVATE" : "PUBLIC");
        setReleaseDate(data.releaseDate?.split("T")[0] ?? "");
        setGenre(data.genre ?? "");
        setTags(data.tags ?? []);
        setCoverPreview(data.coverImageUrl ?? null);
        setLoadingEdit(false);
      })
      .catch(() => setLoadingEdit(false));
  }, [isOpen, playlist.playlistId]);

  if (!isOpen) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await playlistsApi.uploadCover(playlist.playlistId, file);
      setCoverPreview(res.coverImageUrl);
      toast.success("Cover updated");
      onSaved?.({ ...playlist, cover: res.coverImageUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await playlistsApi.updatePlaylist(playlist.playlistId, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility: visibility === "PRIVATE" ? "secret" : "public",
        releaseDate: releaseDate || undefined,
        genre: genre || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast.success("Playlist updated.");
      onSaved?.({
        ...playlist,
        title: title.trim(),
        description: description.trim() || null,
        visibility: visibility === "PRIVATE" ? "SECRET" : "PUBLIC",
        cover: coverPreview,
        releaseDate: releaseDate || null,
        tags,
      });
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update playlist",
      );
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "block text-xs font-bold text-white mb-1.5";
  const inputCls =
    "w-full bg-[#0e0e0e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-205 max-w-[95vw] max-h-[90vh] overflow-hidden bg-[#121212] border border-neutral-700 rounded-lg shadow-2xl flex flex-col"
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

        {/* TABS */}
        <div className="flex items-center gap-6 px-6 pt-5 border-b border-neutral-700">
          {(
            [
              ["basic", "Basic info"],
              ["tags", "Tags"],
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
          {/* BASIC TAB */}
          {tab === "basic" && (
            <div className="grid grid-cols-[260px_1fr] gap-6">
              <div>
                <div className="relative aspect-square rounded bg-[#222] overflow-hidden flex items-center justify-center">
                  {coverPreview ? (
                    <Image
                      src={coverPreview}
                      alt={title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-zinc-500 text-sm">No cover</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs cursor-pointer py-2 hover:bg-black/80 transition-colors"
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

                <div>
                  <label className={labelCls}>Release date</label>
                  <DatePickerInput
                    value={releaseDate}
                    onChange={setReleaseDate}
                  />
                </div>

                <div>
                  <label className={labelCls}>Genre</label>
                  <select
                    value={genre}
                    onChange={(e) =>
                      setGenre(e.target.value === "None" ? "" : e.target.value)
                    }
                    className={inputCls}
                  >
                    {[
                      "None",
                      "electronic",
                      "hip-hop",
                      "pop",
                      "rock",
                      "alternative",
                      "ambient",
                      "classical",
                      "jazz",
                      "r-b-soul",
                      "metal",
                      "folk-singer-songwriter",
                      "country",
                      "reggaeton",
                      "dancehall",
                      "drum-bass",
                      "house",
                      "techno",
                      "deep-house",
                      "trance",
                      "lo-fi",
                      "indie",
                      "punk",
                      "blues",
                      "latin",
                      "afrobeat",
                      "trap",
                      "experimental",
                      "world",
                      "gospel",
                      "spoken-word",
                      "quran",
                      "sha3by",
                      "islamic",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g === "None" ? "— None —" : g}
                      </option>
                    ))}
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

          {/* TAGS TAB */}
          {tab === "tags" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-white text-xs rounded"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-zinc-800 text-white text-xs px-2 py-1 rounded"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-zinc-400 hover:text-white ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white cursor-pointer hover:bg-zinc-800 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingEdit}
            className="px-4 py-2 text-sm font-bold bg-white hover:bg-neutral-600 disabled:opacity-50 text-black rounded-md transition-colors cursor-pointer"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}