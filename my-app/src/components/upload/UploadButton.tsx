"use client";

import React, { useState } from "react";
import { useUploadStore } from "@/src/store/uploadStore";
import FileStatusBadge from "@/src/components/ui/FileStatusBadge";
import { uploadTrack, getTrackStatus } from "@/src/services/uploadService";

interface FileStatus {
  name: string;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "DONE" | "ERROR";
  trackId?: string;
  errorMessage?: string;
}

const UploadButton: React.FC = () => {
  const { files, setFiles, metadata } = useUploadStore();
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const updateFileStatus = (
    fileName: string,
    status: FileStatus["status"],
    trackId?: string,
    errorMessage?: string,
  ) => {
    setFileStatuses((prev) =>
      prev.map((f) =>
        f.name === fileName
          ? {
              ...f,
              status,
              trackId: trackId ?? f.trackId,
              errorMessage: errorMessage ?? f.errorMessage,
            }
          : f,
      ),
    );
  };

  const pollTrackStatus = async (fileName: string, trackId: string) => {
    const interval = 2000;
    let status = "PROCESSING";

    while (status === "PROCESSING") {
      try {
        const data = await getTrackStatus(trackId);
        status = data.status;

        if (status === "PROCESSING") {
          await new Promise((r) => setTimeout(r, interval));
        } else {
          updateFileStatus(fileName, "DONE");
        }
      } catch (err: any) {
        updateFileStatus(
          fileName,
          "ERROR",
          undefined,
          err.message || "Polling error",
        );
        break;
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setFileStatuses(files.map((f) => ({ name: f.name, status: "PENDING" })));

    for (const file of files) {
      updateFileStatus(file.name, "UPLOADING");

      try {
        if (!metadata) throw new Error("Metadata missing");
        const data = await uploadTrack(file, metadata);

        if (data.status === "PROCESSING" && data.trackId) {
          updateFileStatus(file.name, "PROCESSING", data.trackId);
          pollTrackStatus(file.name, data.trackId);
        } else {
          updateFileStatus(file.name, "DONE");
        }
      } catch (err: any) {
        updateFileStatus(
          file.name,
          "ERROR",
          undefined,
          err.message || "Upload error",
        );
      }
    }

    setFiles([]);
  };

  return (
    <div>
      <button
        onClick={handleUpload}
        className="mt-4 w-full bg-white text-lg transition duration-300 hover:bg-[#ff5500] text-black font-bold py-2 px-4 rounded disabled:opacity-50"
        disabled={files.length === 0}
      >
        Upload {files.length > 0 ? `(${files.length}) files` : ""}
      </button>

      <div className="mt-4 space-y-2">
        {fileStatuses.map((f) => (
          <div
            key={f.name}
            className="flex flex-col items-center p-3 border rounded-lg"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">{f.name}</span>
              <FileStatusBadge status={f.status} />
            </div>

            {f.status === "ERROR" && f.errorMessage && (
              <div className="text-red-600 text-sm mt-1">{f.errorMessage}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadButton;
