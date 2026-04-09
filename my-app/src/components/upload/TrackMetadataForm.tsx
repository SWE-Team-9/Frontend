"use client";

import React, { useState } from "react";
import UploadButton from "@/src/components/upload/UploadButton";
import { useUploadStore } from "@/src/store/useuploadStore";
import DatePickerInput from "@/src/components/ui/DatePickerInput";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";

const MAX_DESCRIPTION = 5000;
const GENRES = [
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
];

interface FormErrors {
  title?: string;
  genre?: string;
  tags?: string;
  releaseDate?: string;
  description?: string;
}

const TrackMetadataForm = () => {
  const { setMetadata } = useUploadStore();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("None");
  const [tags, setTags] = useState("");
  const [saved, setSaved] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = "Track title is required.";
    if (!genre.trim() || genre === "None")
      newErrors.genre = "Genre is required.";
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length === 0) newErrors.tags = "At least one tag is required.";
    else if (tagList.length > 10) newErrors.tags = "Maximum 10 tags allowed.";
    if (!releaseDate) newErrors.releaseDate = "Release date is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    else if (description.length > MAX_DESCRIPTION)
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION} characters.`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveMetadata = () => {
    if (!validate()) {
      setTimeout(() => setErrors({}), 3000);
      return;
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setMetadata({
      title,
      genre,
      tags: tagList,
      releaseDate,
      visibility,
      description,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl w-full bg-[#121212] p-6 rounded-xl">
      <h1 className="text-5xl font-bold text-white mb-6 text-center pb-4">
        Track Info
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column — metadata fields */}
        <div className="flex flex-col flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="font-medium pb-2 text-xl">Track Title</label>
            <input
              placeholder="Enter Track Title"
              className={`w-full focus:outline-none focus:border-[#ff5500] transition duration-300 mb-1 p-2 rounded border ${errors.title ? "border-red-500" : "border-[#8c8c8c]"}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mb-3">{errors.title}</p>
            )}
            {!errors.title && <div className="mb-4" />}
          </div>

          {/* Genre */}
          <div className="flex flex-col gap-1">
            <label className="font-medium pb-2 text-xl">Genre</label>
            <select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                if (errors.genre)
                  setErrors((prev) => ({ ...prev, genre: undefined }));
              }}
              className={`genre-select w-full focus:outline-none focus:ring-2 focus:ring-[#ff5500aa] focus:border-[#ff5500] transition duration-300 mb-1 p-2 rounded border bg-[#333333] text-white ${errors.genre ? "border-red-500" : "border-[#8c8c8c]"}`}
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-[#1a1a1a]">
                  {g}
                </option>
              ))}
            </select>
            {errors.genre && (
              <p className="text-red-500 text-sm mb-3">{errors.genre}</p>
            )}
            {!errors.genre && <div className="mb-4" />}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="font-medium pb-2 text-xl">Tags</label>
            <input
              placeholder="Tags (comma separated)"
              className={`w-full focus:outline-none focus:border-[#ff5500] transition duration-300  mb-1 p-2 rounded border ${errors.tags ? "border-red-500" : "border-[#8c8c8c]"}`}
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                if (errors.tags)
                  setErrors((prev) => ({ ...prev, tags: undefined }));
              }}
            />
            {errors.tags && (
              <p className="text-red-500 text-sm mb-3">{errors.tags}</p>
            )}
            {!errors.tags && <div className="mb-4" />}
          </div>

          {/* Release Date */}
          <DatePickerInput
            value={releaseDate}
            onChange={(val) => {
              setReleaseDate(val);
              if (errors.releaseDate)
                setErrors((prev) => ({ ...prev, releaseDate: undefined }));
            }}
          />
          {errors.releaseDate && (
            <p className="text-red-500 text-sm mt-1 mb-3">
              {errors.releaseDate}
            </p>
          )}
          {!errors.releaseDate && <div className="mb-4" />}

          {/* Visibility */}
          <div className="flex flex-col gap-1">
            <label className="font-medium pt-4 pb-2 text-xl">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`flex-1 py-2 rounded border font-bold transition duration-300 ${
                  visibility === "PUBLIC"
                    ? "bg-[#ff5500] text-white border-[#ff5500]"
                    : "bg-transparent text-[#8c8c8c] border-[#8c8c8c]"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`flex-1 py-2 rounded border font-bold transition duration-300 ${
                  visibility === "PRIVATE"
                    ? "bg-[#ff5500] text-white border-[#ff5500]"
                    : "bg-transparent text-[#8c8c8c] border-[#8c8c8c]"
                }`}
              >
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Right column — description */}
        <div className="flex flex-col flex-1">
          <label className="font-medium pb-2 text-xl">Description</label>
          <textarea
            placeholder="Describe your track"
            className={`w-full p-2 focus:outline-none focus:border-[#ff5500] transition duration-300 rounded border resize-none flex-1 min-h-75 ${
              errors.description ? "border-red-500" : "border-[#8c8c8c]"
            }`}
            value={description}
            maxLength={MAX_DESCRIPTION}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description)
                setErrors((prev) => ({ ...prev, description: undefined }));
            }}
          />
          {/* Character counter */}
          <p
            className={`text-sm mt-1 text-right ${
              description.length > MAX_DESCRIPTION
                ? "text-red-500"
                : "text-[#8c8c8c]"
            }`}
          >
            {description.length} / {MAX_DESCRIPTION}
          </p>
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Waveform Preview */}
      <div className="mt-6">
        <label className="font-medium pb-2 text-xl block mb-2 text-white">
          Waveform Preview
        </label>
        <div className="w-full h-20 rounded overflow-hidden">
          <WaveformDisplay />
        </div>
      </div>

      {/* Save Info */}
      <button
        onClick={handleSaveMetadata}
        className="mt-8 w-full bg-white text-black cursor-pointer font-bold hover:bg-[#ff5500] transition duration-300 text-lg py-2 rounded mb-4"
      >
        Save Info
      </button>

      {saved && (
        <p className="text-green-500 font-semibold text-center mb-4">
          Track Info Saved Successfully!
        </p>
      )}

      {/* Upload Button */}
      <UploadButton />
    </div>
  );
};

export default TrackMetadataForm;
