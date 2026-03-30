"use client";

import React, { useRef } from "react";
import { useUploadStore } from "@/src/store/uploadStore";
import { IoIosCloudUpload } from "react-icons/io";

// Handles file selection via click or drag-and-drop,
// and updates the upload store with selected files

interface DropzoneProps {
  onFilesAdded?: (files: File[]) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
  const { addFile } = useUploadStore();

  const inputRef = useRef<HTMLInputElement>(null); // Ref to the hidden file input element

  // Converts FileList to an array and adds each file to the store
  const handleFiles = (files: FileList) => {
    const arr = Array.from(files);
    arr.forEach((file) => addFile(file));
    onFilesAdded?.(arr);
  };

  return (
    <div
      className="border-2 border-dashed border-neutral-600 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-white transition h-96 w-full"
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept=".wav,.mp3"
        multiple
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
        Supported: WAV, MP3 (Max 4GB)
      </p>
    </div>
  );
};

export default Dropzone;
