"use client";

import React from "react";
import Dropzone from "@/src/components/upload/Dropzone";
import { useUploadStore } from "@/src/store/useuploadStore";
import { MdDeleteForever } from "react-icons/md";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

interface Props {
  onNext: () => void;
}

const UploadForm: React.FC<Props> = ({ onNext }) => {
  const { files, removeFile } = useUploadStore();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[#121212] rounded-lg w-full">
      <h1 className="text-2xl font-bold text-white mb-6">
        Upload your audio files
      </h1>

      <Dropzone disabled={files.length >= 1} />

{files.length > 0 && (
  <button
    onClick={async () => {
      try {
        // 1. Fetch updated subscription to decrease the counter immediately 
        // This ensures the global state reflects the new upload quota right away 
        await useSubscriptionStore.getState().fetchSubscription(); 

        // 2. Proceed to the metadata step
        onNext(); 
      } catch (error) {
        console.error("Failed to update quota:", error);
        // Even if update fails, we proceed to keep the flow smooth
        onNext();
      }
    }}
    className="mt-6 px-6 py-3 font-bold bg-white hover:bg-[#ff5500] transition duration-300 cursor-pointer text-black rounded-lg w-full text-lg"
  >
    Next
  </button>
)}

      {files.length > 0 && (
        <button
          onClick={onNext}
          className="mt-6 px-6 py-3 font-bold bg-white hover:bg-[#ff5500] transition duration-300 cursor-pointer text-black rounded-lg w-full text-lg"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default UploadForm;