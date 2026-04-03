"use client";

import React, { useRef, useState } from "react";
import UploadButton from "@/src/components/upload/UploadButton";
import { useUploadStore } from "@/src/store/useUploadStore";

interface FormErrors {
  title?: string;
  genre?: string;
  tags?: string;
  releaseDate?: string;
}

const TrackMetadataForm = () => {
  const { setMetadata } = useUploadStore();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [saved, setSaved] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [errors, setErrors] = useState<FormErrors>({});

  const releaseInputRef = useRef<HTMLInputElement>(null);
  const handleDateClick = () => {
    releaseInputRef.current?.showPicker?.();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = "Track title is required.";
    if (!genre.trim()) newErrors.genre = "Genre is required.";
    if (!tags.trim()) newErrors.tags = "At least one tag is required.";
    if (!releaseDate) newErrors.releaseDate = "Release date is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveMetadata = () => {
    if (!validate()) {
      setTimeout(() => setErrors({}), 3000);
      return;
    }

    setMetadata({
      title,
      genre,
      tags: tags.split(",").map((t) => t.trim()),
      releaseDate,
      visibility,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000); // Hide message after 3 seconds
  };

  return (
    <div className="max-w-2xl w-full bg-[#121212] p-6 rounded-xl">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Track Info</h1>

      {/* Title */}
      <div className="flex flex-col gap-1">     
        <label className="font-medium pb-2 text-xl">Track Title</label> 
        <input
        placeholder="Enter Track Title"
        className={`w-full mb-1 p-2 rounded border ${errors.title ? "border-red-500" : "border-[#8c8c8c]"}`}
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
      </div>

      {/* Genre */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Genre</label>
        <input
          placeholder="Enter Genre"
          className={`w-full mb-4 p-2 rounded border ${errors.genre ? "border-red-500" : "border-[#8c8c8c]"}`}
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            if (errors.genre)
              setErrors((prev) => ({ ...prev, genre: undefined }));
          }}
        />
        {errors.genre && (
          <p className="text-red-500 text-sm mb-3">{errors.genre}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Tags</label>
        <input
          placeholder="Tags (comma separated)"
          className={`w-full mb-4 p-2 rounded border ${errors.tags ? "border-red-500" : "border-[#8c8c8c]"}`}
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
      </div>

      {/* Release Date */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Release Date</label>
        <input
          ref={releaseInputRef}
          type="date"
          value={releaseDate}
          onChange={(e) => {
            setReleaseDate(e.target.value);
            if (errors.releaseDate)
              setErrors((prev) => ({ ...prev, releaseDate: undefined }));
          }}
          onClick={handleDateClick} // triggers calendar popup
          className={`w-full mb-6 p-2 rounded border ${errors.releaseDate ? "border-red-500" : "border-[#8c8c8c]"}`}
        />
        {errors.releaseDate && (
          <p className="text-red-500 text-sm mb-3">{errors.releaseDate}</p>
        )}
      </div>

      {/* Visibility */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Visibility</label>
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setVisibility("PUBLIC")}
            className={`flex-1 py-2 rounded border font-bold transition duration-300 ${
              visibility === "PUBLIC"
                ? "bg-white text-black border-white"
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
                ? "bg-white text-black border-white"
                : "bg-transparent text-[#8c8c8c] border-[#8c8c8c]"
            }`}
          >
            Private
          </button>
        </div>
      </div>

      {/* Save Info */}
      <button
        onClick={handleSaveMetadata}
        className="w-full bg-white text-black cursor-pointer font-bold hover:bg-[#ff5500] transition duration-300 text-lg py-2 rounded mb-4"
      >
        Save Info
      </button>
      {saved && (
        <p className="text-green-500 font-semibold text-center">
          Track Info Saved Successfully!
        </p>
      )}

      {/* Upload Button */}
      <UploadButton />
    </div>
  );
};

export default TrackMetadataForm;
