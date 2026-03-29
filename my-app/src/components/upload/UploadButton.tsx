"use client";

import React from "react";
import { useUploadStore } from "@/src/store/uploadStore";

const UploadButton: React.FC = () => {
  const { files, setFiles } = useUploadStore();

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      alert("Files uploaded successfully!");
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check console.");
    }
  };

  return (
    <button
      onClick={handleUpload}
      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
      disabled={files.length === 0}
    >
      Upload {files.length > 0 ? `(${files.length}) files` : ""}
    </button>
  );
};

export default UploadButton;