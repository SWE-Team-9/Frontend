"use client";

import React, { useEffect, useState } from "react";
import UploadForm from "@/src/components/upload/UploadForm";
import TrackMetadataForm from "@/src/components/upload/TrackMetadataForm";
import { getMyProfile } from "@/src/services/profileService";

export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "metadata">("upload");
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [canUpload, setCanUpload] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((profile) => {
        if (!active) return;
        const isArtist = profile.accountType === "ARTIST";
        setCanUpload(isArtist);
        setAccessMessage(
          isArtist
            ? null
            : "Only users with ARTIST accounts can upload tracks.",
        );
      })
      .catch(() => {
        if (!active) return;
        setCanUpload(false);
        setAccessMessage("Could not verify upload permission. Please sign in again.");
      })
      .finally(() => {
        if (!active) return;
        setIsCheckingAccess(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isCheckingAccess) {
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <p className="text-zinc-300 text-sm">Checking upload permissions...</p>
      </main>
    );
  }

  if (!canUpload) {
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-lg border border-zinc-800 bg-[#181818] p-6 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Upload Not Allowed</h1>
          <p className="text-sm text-zinc-400">
            {accessMessage ?? "Only users with ARTIST accounts can upload tracks."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] flex items-start justify-center p-6">
      {step === "upload" && <UploadForm onNext={() => setStep("metadata")} />}
      {step === "metadata" && <TrackMetadataForm />}
    </main>
  );
}