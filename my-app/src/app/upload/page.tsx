"use client";

import React, { useEffect, useState } from "react";
import UploadForm from "@/src/components/upload/UploadForm";
import TrackMetadataForm from "@/src/components/upload/TrackMetadataForm";
// --- NEW IMPORTS FOR UPLOAD GUARD ---
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import SubscriptionModal from "@/src/components/subscription/SubscriptionModal";
import { useRouter } from 'next/navigation';
export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "metadata">("upload");
  const [isCheckingAccess, _setIsCheckingAccess] = useState(false);
  const [canUpload, _setCanUpload] = useState(true);
  const [accessMessage, _setAccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // --- SUBSCRIPTION STORE STATE ---
  const sub = useSubscriptionStore((state) => state.sub);
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial fetch to ensure we have the latest upload quota 
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);
// ////////////////////comment/////////////////////
//   useEffect(() => {
//     let active = true;

//     getMyProfile()
//       .then((profile) => {
//         if (!active) return;
//         const isArtist =
//           profile.accountType?.trim().toUpperCase() === "ARTIST";
//         setCanUpload(isArtist);
//         setAccessMessage(
//           isArtist
//             ? null
//             : "Only users with ARTIST accounts can upload tracks.",
//         );
//       })
//       .catch(() => {
//         if (!active) return;
//         setCanUpload(false);
//         setAccessMessage("Could not verify upload permission. Please sign in again.");
//       })
//       .finally(() => {
//         if (!active) return;
//         setIsCheckingAccess(false);
//       });

//     return () => {
//       active = false;
//     };
//   }, []);

  /////////////////////////comment//////////////////////////////

  // --- SECURITY GUARD LOGIC ---
  // Prevents Free users from exceeding their upload quota 
  const handleNextStep = () => {
    if (!sub) return;

    // Check if user has remaining uploads allowed 
    if (sub.remainingUploads !== null && sub.remainingUploads <= 0) {
      // User reached the limit (e.g., 3 tracks for FREE tier) 
      setIsModalOpen(true);
    } else {
      // Quota available, proceed to metadata step
      setStep("metadata");
    }
  };

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
    <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-start p-6">
      {/* Optional: Quota Status Display  */}
      {sub && (
        <div className="mb-8 text-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 w-full max-w-md">
          <p className="text-zinc-400 text-sm font-medium">
            Upload Quota: 
            <span className="text-[#f50] font-bold ml-2">
              {sub.remainingUploads} of {sub.uploadLimit} remaining
            </span>
          </p>
        </div>
      )}
{/* ─── UPLOAD AREA WRAPPER ─── */}
{/* We wrap the form in a relative div to position the security overlay correctly */}
<div className="relative w-full max-w-4xl">
  
  {/* SECURITY OVERLAY: 
      This div acts as a 'Shield'. If remainingUploads is 0, this transparent layer 
      intercepts the click and shows the Modal instead of opening the file picker. [cite: 65]
  */}
  {sub && sub.remainingUploads !== null && sub.remainingUploads <= 0 && step === "upload" && (
    <div 
      onClick={() => setIsModalOpen(true)} 
      className="absolute inset-0 z-50 cursor-pointer bg-transparent"
      title="Upload limit reached"
    ></div>
  )}

      {/* Logic: Intercept step change with handleNextStep  */}
  {step === "upload" && <UploadForm onNext={handleNextStep} />}
  {step === "metadata" && <TrackMetadataForm />}
</div>

      {/* Premium Modal for quota-limited users */}
<SubscriptionModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
  // Add this line to handle the upgrade button click
  onUpgrade={() => {
    setIsModalOpen(false); // Close the modal
    router.push('/subscriptions'); // Redirect to plans page 
  }}
/>



    </main>
  );
}