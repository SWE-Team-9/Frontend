"use client";

import React, { useRef, useState } from "react";
import { useUploadStore } from "@/src/store/useuploadStore";
import { IoIosCloudUpload } from "react-icons/io";

// Handles file selection via click or drag-and-drop,
// and updates the upload store with selected files

interface DropzoneProps {
  onFilesAdded?: (files: File[]) => void;
  disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, disabled }) => {
  const [_isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref to the hidden file input element
  const { addFile, files: _files } = useUploadStore();

  const handleFiles = (filesList: FileList) => {
    const file = filesList[0];
    if (!file) return;

    addFile(file);
    onFilesAdded?.([file]);
  };

    // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition h-96 w-full
  ${
    disabled
      ? "border-neutral-700 opacity-50 cursor-not-allowed"
      : "border-neutral-600 cursor-pointer hover:border-white"
  }`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".wav,.mp3"
        className="hidden"
        ref={inputRef}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Centered Icon and Text */}
      <IoIosCloudUpload size={140} className="text-gray-300 mb-4" />
      <p className="text-center text-gray-300 font-medium">
        Drag and drop audio files here or click to select
      </p>
      <p className="text-center text-sm text-gray-500 mt-1">
        Supported: WAV, MP3 (Max 250 MB)
      </p>
    </div>
  );
};

export default Dropzone;
