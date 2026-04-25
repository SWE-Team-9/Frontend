"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, X } from "lucide-react";

interface Props {
  permalink: string;    
  onClose: () => void;
}

export default function SharePopup({ permalink, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Build the full absolute URL the user will share
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${permalink}`
      : permalink;

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const tmp = document.createElement("textarea");
      tmp.value = fullUrl;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 z-50 w-80 rounded-md border border-zinc-700 bg-[#1e1e1e] p-3 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-zinc-400">Share link</p>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={fullUrl}
          onFocus={(e) => e.target.select()}
          className="flex-1 truncate rounded border border-zinc-700 bg-[#121212] px-2 py-1.5 text-xs text-white outline-none"
        />
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition-colors ${
            copied
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}