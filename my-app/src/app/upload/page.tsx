"use client";

import React, { useState } from "react";
import UploadForm from "@/src/components/upload/UploadForm";
import TrackMetadataForm from "@/src/components/upload/TrackMetadataForm";

export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "metadata">("upload");

  return (
    <main className="min-h-screen bg-[#121212] flex items-start justify-center p-6">
      {step === "upload" && <UploadForm onNext={() => setStep("metadata")} />}
      {step === "metadata" && <TrackMetadataForm />}
    </main>
  );
}