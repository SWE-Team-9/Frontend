"use client";

import React from "react";
import Dropzone from "./Dropzone";
import UploadButton from "./UploadButton";
import { useUploadStore } from "@/src/store/uploadStore";

const UploadForm: React.FC = () => {
  const { files, removeFile } = useUploadStore();

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-gray-900 rounded-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Upload your audio files</h1>
      <Dropzone />
      {files.length > 0 && (
        <ul className="mt-4 space-y-2 text-gray-200">
          {files.map((file, idx) => (
            <li key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span>{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <UploadButton />
    </div>
  );
};

export default UploadForm;