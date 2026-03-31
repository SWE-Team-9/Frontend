"use client";

import React, { useState } from "react";
import { useUploadStore } from "@/src/store/uploadStore";
import FileStatusBadge from "@/src/components/ui/FileStatusBadge";

interface FileStatus {
  name: string;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "DONE" | "ERROR";
  trackId?: string;
  errorMessage?: string;
}

const UploadButton: React.FC = () => {
  const { files, setFiles } = useUploadStore();
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
    const interval = 2000; // 2 seconds
    let status = "PROCESSING";

    while (status === "PROCESSING") {
      try {
        const res = await fetch(`/api/v1/tracks/${trackId}/status`);
        if (!res.ok) throw new Error("Failed to get track status");

        const data = await res.json();
        status = data.status;

        if (status === "PROCESSING") {
          await new Promise((r) => setTimeout(r, interval));
        } else {
          updateFileStatus(fileName, "DONE");
        }
      } catch (err: unknown) {
        let message = "Unknown error during polling";

        if (err instanceof Error) {
          message = err.message;
        }

        updateFileStatus(fileName, "ERROR", undefined, message);
        break;
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setFileStatuses(files.map((f) => ({ name: f.name, status: "PENDING" })));

    for (const file of files) {
      updateFileStatus(file.name, "UPLOADING");

      // const formData = new FormData();
      // formData.append("audioFile", file);
      // formData.append("tags", JSON.stringify(["exampleTag1", "exampleTag2"]));
      const payload = {
        fileName: file.name,
        tags: ["exampleTag1", "exampleTag2"], // Example tags, replace with actual tags if needed
      };

      try {
        // const res = await fetch("/api/v1/tracks", {
        //   method: "POST",
        //   body: formData,
        const res = await fetch("/api/v1/tracks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Set content type to JSON since we're sending a JSON payload
          },
          body: JSON.stringify(payload), // convert object to JSON string
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        if (data.status === "PROCESSING" && data.trackId) {
          updateFileStatus(file.name, "PROCESSING", data.trackId);
          pollTrackStatus(file.name, data.trackId);
        } else {
          updateFileStatus(file.name, "DONE");
        }
      } catch (err: unknown) {
        let message = "Unknown error during upload";

        if (err instanceof Error) {
          message = err.message;
        }

        updateFileStatus(file.name, "ERROR", undefined, message);
      }
    }

    setFiles([]);
  };

  return (
    <div>
      <button
        onClick={handleUpload}
        className="mt-4 w-full bg-white text-lg hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded disabled:opacity-50"
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
