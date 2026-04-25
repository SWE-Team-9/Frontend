/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaCopy, FaCheck, FaCode } from "react-icons/fa";
import { playlistsApi } from "@/src/services/api/playlists";

interface Props {
  playlistId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EmbedModal({ playlistId, isOpen, onClose }: Props) {
  const [embed, setEmbed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmbed("");
      setError(null);
      setCopied(false);
      return;
    }

    setIsLoading(true);
    playlistsApi
      .getEmbedCode(playlistId)
      .then((res) => setEmbed(res.embedCode))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load embed code")
      )
      .finally(() => setIsLoading(false));
  }, [isOpen, playlistId]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
    setCopied(true);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FaCode size={11} /> Embed Code
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-zinc-400 text-xs mb-3">
            Paste this code into your website to embed this playlist:
          </p>

          {isLoading && (
            <p className="text-zinc-500 text-xs text-center py-6">Loading...</p>
          )}

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          {!isLoading && embed && (
            <>
              <textarea
                readOnly
                value={embed}
                rows={6}
                className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 rounded text-white text-xs font-mono mb-3 resize-none"
                onFocus={(e) => e.target.select()}
              />
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