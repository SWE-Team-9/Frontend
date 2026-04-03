"use client";

import React, { useRef, useState } from "react";
import UploadButton from "@/src/components/upload/UploadButton";
import { useUploadStore } from "@/src/store/uploadStore";

const TrackMetadataForm = () => {
  const { setMetadata } = useUploadStore();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const releaseInputRef = useRef<HTMLInputElement>(null);
   const handleDateClick = () => {
    releaseInputRef.current?.showPicker?.();
  };

  const handleSaveMetadata = () => {
    setMetadata({
      title,
      genre,
      tags: tags.split(",").map((t) => t.trim()),
      releaseDate,
    });
  };

  return (
    <div className="max-w-2xl w-full bg-[#121212] p-6 rounded-xl">
      <h1 className="text-3xl font-bold text-white mb-6">Track Info</h1>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Track Title</label>
        <input
          placeholder="Enter Track Title"
          required
          className="w-full mb-4 p-2 rounded border border-[#8c8c8c]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Genre */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Genre</label>
        <input
          placeholder="Enter Genre"
          className="w-full mb-4 p-2 rounded border border-[#8c8c8c]"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <label className="font-medium pb-2 text-xl">Tags</label>
        <input
          placeholder="Tags (comma separated)"
          className="w-full mb-4 p-2 rounded border border-[#8c8c8c]"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* Release Date */}
     <div className="flex flex-col gap-1">
      <label className="font-medium pb-2 text-xl">Release Date</label>
      <input
        ref={releaseInputRef}
        type="date"
        value={releaseDate}
        onChange={(e) => setReleaseDate(e.target.value)}
        onClick={handleDateClick} // triggers calendar popup
        className="w-full mb-6 p-2 rounded border border-[#8c8c8c]"
      />
    </div>

      {/* Save Info */}
      <button
        onClick={handleSaveMetadata}
        className="w-full bg-white text-black cursor-pointer font-bold hover:bg-[#ff5500] transition duration-300 text-lg py-2 rounded mb-4"
      >
        Save Info
      </button>

      {/* Upload Button */}
      <UploadButton />
    </div>
  );
};

export default TrackMetadataForm;
