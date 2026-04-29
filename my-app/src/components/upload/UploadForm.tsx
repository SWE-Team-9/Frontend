"use client";

import React, { useEffect, useState } from "react";
import Dropzone from "@/src/components/upload/Dropzone";
import { useUploadStore } from "@/src/store/useuploadStore";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { MdDeleteForever } from "react-icons/md";
import Link from "next/link";

interface Props {
  onNext: () => void;
}

const UploadForm: React.FC<Props> = ({ onNext }) => {
  const { files, removeFile } = useUploadStore();

  // ── Subscription state from global store ──────────────────────
  const sub = useSubscriptionStore((state) => state.sub);
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);
  const isSubLoading = useSubscriptionStore((state) => state.isLoading);

  // Fetch fresh quota when the upload page mounts
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Derived values ────────────────────────────────────────────
  const remaining = sub?.remainingUploads ?? null;
  const uploadLimit = sub?.uploadLimit ?? null;
  const isQuotaExhausted = remaining !== null && remaining <= 0;

  // ── Quota banner color ────────────────────────────────────────
  const quotaColor =
    remaining === null
      ? "text-zinc-400"
      : remaining <= 1
        ? "text-red-400"
        : remaining <= 3
          ? "text-yellow-400"
          : "text-green-400";

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[#121212] rounded-lg w-full">
      <h1 className="text-2xl font-bold text-white mb-2">
        Upload your audio files
      </h1>

      {/* ── Upload Quota Banner ─────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {isSubLoading ? (
          <span className="text-zinc-500 animate-pulse">Checking quota...</span>
        ) : sub ? (
          <>
            <span className="text-zinc-400">Upload quota:</span>
            <span className={`font-bold ${quotaColor}`}>
              {remaining} / {uploadLimit} remaining
            </span>
            {isQuotaExhausted && (
              <span className="ml-2 text-xs bg-red-900/50 text-red-400 border border-red-700 px-2 py-0.5 rounded-full">
                Limit reached
              </span>
            )}
          </>
        ) : null}
      </div>

      {/* ── Quota Exhausted Block ───────────────────────────────── */}
      {isQuotaExhausted ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-red-800 bg-red-950/30 rounded-xl p-10 text-center">
          <p className="text-red-400 font-bold text-lg">
            You are reached your upload limit
          </p>
          <p className="text-zinc-400 text-sm">
            Upgrade to Artist Pro for unlimited uploads.
          </p>
          <Link
            href="/subscriptions"
            className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-full transition duration-200 text-sm uppercase tracking-wide"
          >
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        // ── Normal upload UI ──────────────────────────────────────
        <>
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
                      className="text-red-500 hover:text-red-700 transition duration-100 font-bold"
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
        </>
      )}
    </div>
  );
};

export default UploadForm;