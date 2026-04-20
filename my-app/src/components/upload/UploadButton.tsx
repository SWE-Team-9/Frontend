"use client";

import React, { useState } from "react";
import { useUploadStore } from "@/src/store/useuploadStore";
import FileStatusBadge from "@/src/components/ui/FileStatusBadge";
import {
  uploadTrack,
  getTrackDetails,
  changeTrackVisibility,
} from "@/src/services/uploadService";
import { useRouter } from "next/navigation";

interface FileStatus {
  name: string;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "DONE" | "ERROR";
  trackId?: string;
  errorMessage?: string;
  resolvedTrackId?: string; // store it for redirect
}

const UploadButton: React.FC = () => {
  const { files, setFiles, metadata } = useUploadStore();
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const router = useRouter();

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
              resolvedTrackId: trackId ?? f.resolvedTrackId,
            }
          : f,
      ),
    );
  };

  const pollTrackStatus = async (fileName: string, trackId: string) => {
    const interval = 3000;
    const maxAttempts = 20; // 1 minute max
    let attempts = 0;

    await new Promise((r) => setTimeout(r, interval));

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const data = await getTrackDetails(trackId);

        if (data.status === "FINISHED") {
          updateFileStatus(fileName, "DONE", trackId);
          const artistHandle = data.artistHandle?.trim();
          const trackSlug = data.slug?.trim();

          if (artistHandle && trackSlug) {
            router.push(`/${encodeURIComponent(artistHandle)}/${encodeURIComponent(trackSlug)}`);
          } else {
            router.push(`/tracks/${trackId}`);
          }
          return;
        }

        if (data.status === "PROCESSING") {
          await new Promise((r) => setTimeout(r, interval));
          continue;
        }

        // Any other status (FAILED etc.) — stop polling
        updateFileStatus(
          fileName,
          "ERROR",
          undefined,
          `Track processing failed: ${data.status}`,
        );
        return;
      } catch (err: unknown) {
        updateFileStatus(
          fileName,
          "ERROR",
          undefined,
          (err as Error).message || "Polling error",
        );
        return;
      }
    }

    // Timed out
    updateFileStatus(
      fileName,
      "ERROR",
      undefined,
      "Processing timed out. Please check your track.",
    );
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
          // Set the visibility the user chose before polling starts
          await changeTrackVisibility(data.trackId, metadata.visibility);
          updateFileStatus(file.name, "PROCESSING", data.trackId);
          pollTrackStatus(file.name, data.trackId);
        } else {
          updateFileStatus(file.name, "DONE");
        }
      } catch (err: unknown) {
        updateFileStatus(
          file.name,
          "ERROR",
          undefined,
          (err as Error).message || "Upload error",
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
