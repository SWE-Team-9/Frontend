/* eslint-disable react-hooks/set-state-in-effect */
"use client";

// React hooks for managing modal state and side effects
import { useEffect, useState } from "react";

// UI icons used inside the embed modal
import { FaTimes, FaCopy, FaCheck, FaCode } from "react-icons/fa";

// API service for fetching embed code
import { playlistsApi } from "@/src/services/api/playlists";

interface Props {
  playlistId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EmbedModal({ playlistId, isOpen, onClose }: Props) {
  // Stores embed HTML/iframe code from API
  const [embed, setEmbed] = useState("");

  // Loading state while fetching embed code
  const [isLoading, setIsLoading] = useState(false);

  // Error state for API failures
  const [error, setError] = useState<string | null>(null);

  // Tracks if user has copied embed code
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset modal state when closed
    if (!isOpen) {
      setEmbed("");
      setError(null);
      setCopied(false);
      return;
    }

    // Start loading embed code
    setIsLoading(true);

    // Fetch embed code from backend
    playlistsApi
      .getEmbedCode(playlistId)
      .then((res) => setEmbed(res.embedCode))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load embed code")
      )
      .finally(() => setIsLoading(false));
  }, [isOpen, playlistId]);

  // Do not render modal if closed
  if (!isOpen) return null;

  // Copy embed code to clipboard
  const handleCopy = async () => {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
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
        className="w-full max-w-lg bg-[#1a1a1a] border border-zinc-800 rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FaCode size={11} /> Embed Code
          </h2>

          {/* Close button */}
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-zinc-400 text-xs mb-3">
            Paste this code into your website to embed this playlist:
          </p>

          {/* Loading state */}
          {isLoading && (
            <p className="text-zinc-500 text-xs text-center py-6">Loading...</p>
          )}

          {/* Error state */}
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          {/* Embed code display */}
          {!isLoading && embed && (
            <>
              {/* Read-only embed code textarea */}
              <textarea
                readOnly
                value={embed}
                rows={6}
                className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-xs font-mono mb-3 resize-none"
                onFocus={(e) => e.target.select()}
              />

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-[#f50] hover:bg-[#e64a00] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors"
              >
                {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
                {copied ? "Copied to clipboard" : "Copy embed code"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}