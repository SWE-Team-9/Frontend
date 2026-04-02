"use client";

import React from "react";
import Dropzone from "@/src/components/upload/Dropzone";
import { useUploadStore } from "@/src/store/useuploadStore";
import { MdDeleteForever } from "react-icons/md";
import { useRouter } from "next/navigation";

// Combines the Dropzone and UploadButton components,
// and displays a list of selected files with the option to remove them before uploading

const UploadForm: React.FC = () => {
  const { files, removeFile } = useUploadStore();
  const router = useRouter();

   const handleNext = () => {
    // Navigate to the metadata form page
    router.push("/track-data"); 
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[#121212] rounded-lg w-full">
      <h1 className="text-2xl font-bold text-white mb-6">Upload your audio files</h1>
      <Dropzone />
      {files.length > 0 && (
        <ul className="mt-4 space-y-2 text-gray-200">
          {files.map((file, idx) => (
            <li key={idx} className="flex justify-between items-center bg-neutral-600 p-2 rounded">
              <span>{file.name}</span>
              <button onClick={() => removeFile(idx)}>
                <MdDeleteForever size={28} className="text-red-500 hover:text-red-700 font-bold" />
              </button>
            </li>
          ))}
        </ul>
      )}

     {/* Next Button instead of UploadButton */}
      {files.length > 0 && (
        <button
          onClick={handleNext}
          className="mt-6 px-6 py-3 bg-white hover:bg-gray-200 cursor-pointer text-black font-semibold rounded-lg w-full text-lg"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default UploadForm;