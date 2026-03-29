"use client";

import React, { useRef } from "react";
import { useUploadStore } from "@/src/store/uploadStore";

interface DropzoneProps {
  onFilesAdded?: (files: File[]) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
  const { addFile } = useUploadStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const arr = Array.from(files);
    arr.forEach((file) => addFile(file));
    onFilesAdded?.(arr);
  };

  return (
    <div
      className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition"
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept=".wav,.flac,.aiff,.alac"
        multiple
        className="hidden"
        ref={inputRef}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-12 w-12 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-6-4v6m0 0l-3-3m3 3l3-3m-9-4h12" />
        </svg>
        <p className="mt-2 text-gray-300">Drag and drop audio files here or click to select</p>
        <p className="mt-1 text-sm text-gray-500">Supported: WAV, FLAC, AIFF, ALAC (Max 4GB)</p>
      </div>
    </div>
  );
};

export default Dropzone;