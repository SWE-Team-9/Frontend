"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Upload, Check } from "lucide-react";
import { updateTrackMetadata } from "@/src/services/uploadService";
import DatePickerInput from "@/src/components/ui/DatePickerInput";

const FALLBACK_IMAGE = "/images/track-placeholder.png";

interface EditTrackModalProps {
  trackId: string;
  initialData: {
    title: string;
    genre: string;
    tags: string[];
    releaseDate: string;
    description: string;
    coverArtUrl?: string | null;
  };
  onClose: () => void;
  onSaved: (updated: {
    title: string;
    genre: string;
    tags: string[];
    releaseDate: string;
    description: string;
    coverArtUrl: string | null;
  }) => void;
}

type Tab = "basic" | "metadata";

const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "Basic info" },
  { id: "metadata", label: "Metadata" },
];

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  trackId,
  initialData,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [title, setTitle] = useState(initialData.title);
  const [genre, setGenre] = useState(initialData.genre);
  const [tags, setTags] = useState<string[]>(initialData.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [releaseDate, setReleaseDate] = useState(
    initialData.releaseDate?.split("T")[0] ?? "",
  );
  const [description, setDescription] = useState(initialData.description);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(
    initialData.coverArtUrl ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFormInvalid = title.trim().length === 0;

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverArtFile(file);
    setCoverArtPreview(URL.createObjectURL(file));
  };

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim().replace(/^#/, "");
      if (!trimmed || tags.includes(trimmed)) return;
      setTags((prev) => [...prev, trimmed]);
    },
    [tags],
  );

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async () => {
    if (isFormInvalid) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateTrackMetadata(trackId, {
        title: title.trim(),
        genre: genre.trim() || undefined,
        tags,
        releaseDate: releaseDate
          ? new Date(releaseDate).toISOString()
          : undefined,
        description: description.trim() || undefined,
        coverArt: coverArtFile ?? undefined,
      });
      onSaved({
        title: title.trim(),
        genre: genre.trim(),
        tags,
        releaseDate,
        description: description.trim(),
        coverArtUrl:
          (updated as { coverArtUrl?: string })?.coverArtUrl ??
          coverArtPreview ??
          initialData.coverArtUrl ??
          null,
      });
      onClose();
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#181818] rounded-xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-white font-semibold text-base">Edit track</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left — cover art */}
          <div className="sm:w-52 shrink-0 flex sm:flex-col items-center gap-3 p-5 border-b sm:border-b-0 sm:border-r border-zinc-800 bg-[#141414]">
            <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-md overflow-hidden bg-zinc-800 group shrink-0">
              <Image
                src={coverArtPreview || FALLBACK_IMAGE}
                alt="Cover art"
                fill
                className="object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center cursor-pointer justify-center gap-1.5 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
              >
                <Upload className="w-4 h-4" />
                Replace image
              </button>
            </div>
            <div className="flex flex-col gap-2 flex-1 sm:flex-none sm:w-full">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded px-3 py-1.5 transition-colors w-full text-center"
              >
                Replace image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverArtChange}
              />
              {coverArtFile && (
                <p className="text-[10px] text-zinc-500 text-center truncate w-full px-1">
                  {coverArtFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Right — tabs + fields */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 px-5 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
                  {error}
                </p>
              )}

              {activeTab === "basic" && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Track title"
                      className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Genre
                    </label>
                    <input
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g. Pop, Hip-Hop, Electronic"
                      className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Additional tags
                    </label>
                    <div className="min-h-10 flex flex-wrap gap-1.5 bg-[#111] border border-zinc-700 rounded-md px-3 py-2 focus-within:border-zinc-500 transition-colors">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-0.5"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-zinc-500 hover:text-white ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => {
                          if (tagInput.trim()) {
                            addTag(tagInput);
                            setTagInput("");
                          }
                        }}
                        placeholder={
                          tags.length === 0 ? "Add tags (press Enter)" : ""
                        }
                        className="flex-1 min-w-25 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Press Enter or comma to add a tag
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your track"
                      rows={4}
                      maxLength={5000}
                      className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-zinc-600 text-right mt-0.5">
                      {description.length} / 5000
                    </p>
                  </div>
                </>
              )}

              {activeTab === "metadata" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Release date
                  </label>
                  <DatePickerInput
                    value={releaseDate}
                    onChange={setReleaseDate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-[#141414] shrink-0">
          <p className="text-[11px] text-zinc-600">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isFormInvalid}
              className="flex items-center cursor-pointer gap-1.5 px-4 py-1.5 text-sm font-semibold bg-white text-black rounded-md hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};