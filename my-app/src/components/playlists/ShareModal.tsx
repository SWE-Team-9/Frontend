"use client";

// React hook for local state management
import { useState } from "react";

// UI icons used in share modal
import { FaTimes, FaCopy, FaCheck, FaLock } from "react-icons/fa";

// Playlist type definition
import { Playlist } from "@/src/types/playlist";

interface Props {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

// Wrapper component controlling modal visibility
export function ShareModal({ playlist, isOpen, onClose }: Props) {
  // If modal is closed, render nothing
  if (!isOpen) return null;

  return <ShareModalContent playlist={playlist} onClose={onClose} />;
}

// Actual modal content component
function ShareModalContent({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  // Tracks copy-to-clipboard state
  const [copied, setCopied] = useState(false);

  // Extract secret token safely from different possible backend formats
  const token =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playlist as any).secretToken ?? (playlist as any).secret_token ?? "";

  // Construct shareable URL only on client-side
  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/library/playlists/secret/${token}`
      : "";

  // Copy share link to clipboard
  const handleCopy = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FaLock size={11} /> Share Secret Link
          </h2>

          {/* Close modal button */}
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Case: No secret token available */}
          {!token ? (
            <p className="text-zinc-400 text-xs">
              This playlist does not have a secret token. The backend should
              return a <code className="text-[#f50]">secretToken</code> field
              for shareable links.
            </p>
          ) : (
            <>
              {/* Share instructions */}
              <p className="text-zinc-400 text-xs mb-3">
                Anyone with this link can view this playlist:
              </p>

              {/* Share URL input + copy button */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-xs"
                  onFocus={(e) => e.target.select()}
                />

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors"
                >
                  {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}