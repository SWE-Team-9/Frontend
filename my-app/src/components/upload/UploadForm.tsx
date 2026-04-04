"use client";

import React from "react";
import Dropzone from "@/src/components/upload/Dropzone";
import { useUploadStore } from "@/src/store/useuploadStore";
import { MdDeleteForever } from "react-icons/md";

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
        <ul className="mt-4 space-y-2 text-gray-200">
          {files.map((file, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center bg-[#8c8c8c] p-2 rounded"
            >
              <span>{file.name}</span>
              <button onClick={() => removeFile(idx)}>
                <MdDeleteForever
                  size={30}
                  className="text-red-700 hover:text-red-500 transition duration-100 font-bold"
                />
              </button>
            </li>
          ))}
        </ul>
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