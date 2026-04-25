"use client";

import { useState } from "react";
import { FaTimes, FaCopy, FaCheck, FaLock } from "react-icons/fa";
import { Playlist } from "@/src/types/playlist";

interface Props {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ playlist, isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return <ShareModalContent playlist={playlist} onClose={onClose} />;
}

function ShareModalContent({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const token =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playlist as any).secretToken ?? (playlist as any).secret_token ?? "";
  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/library/playlists/secret/${token}`
      : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FaLock size={11} /> Share Secret Link
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {!token ? (
            <p className="text-zinc-400 text-xs">
              This playlist does not have a secret token. The backend should
              return a <code className="text-[#f50]">secretToken</code> field
              for shareable links.
            </p>
          ) : (
            <>
              <p className="text-zinc-400 text-xs mb-3">
                Anyone with this link can view this playlist:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-xs"
                  onFocus={(e) => e.target.select()}
                />
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