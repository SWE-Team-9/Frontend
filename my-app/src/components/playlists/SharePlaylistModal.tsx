"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FaTimes, FaTwitter, FaFacebookF, FaTumblr, FaPinterestP } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { Playlist } from "@/src/types/playlist";

interface Props {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export function SharePlaylistModal({ playlist, isOpen, onClose }: Props) {
  const [tab, setTab] = useState<"share" | "message">("share");
  const [shorten, setShorten] = useState(false);

  if (!isOpen) return null;

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/library/playlists/${playlist.playlistId}`
      : `/library/playlists/${playlist.playlistId}`;

  const shortUrl = url.replace(/^https?:\/\//, "").slice(0, 40) + "…";
  const shareUrl = shorten ? shortUrl : url;

  const socials = [
    { icon: FaTwitter, color: "bg-[#1da1f2]", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}` },
    { icon: FaFacebookF, color: "bg-[#1877f2]", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { icon: FaTumblr, color: "bg-[#35465c]", href: `https://www.tumblr.com/share/link?url=${encodeURIComponent(url)}` },
    { icon: FaPinterestP, color: "bg-[#e60023]", href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}` },
    { icon: MdEmail, color: "bg-zinc-600", href: `mailto:?body=${encodeURIComponent(url)}` },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[520px] max-w-[92vw] bg-[#1a1a1a] border border-zinc-800 rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-zinc-500 hover:text-white"
        >
          <FaTimes size={14} />
        </button>

        <div className="flex items-center gap-6 px-6 pt-5 border-b border-zinc-800">
          {(["share", "message"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-bold capitalize ${
                tab === t
                  ? "text-white border-b-2 border-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "share" && (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative w-24 h-24 rounded overflow-hidden bg-[#222] flex-shrink-0">
                {playlist.cover && (
                  <Image src={playlist.cover} alt={playlist.title} fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-zinc-400 text-xs">{playlist.owner?.display_name ?? "You"}</p>
                <p className="text-white text-sm font-bold truncate">{playlist.title}</p>
                <p className="text-zinc-600 text-xs mt-1">
                  {playlist.tracksCount ?? 0} tracks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-11 h-11 rounded-full ${s.color} flex items-center justify-center text-white hover:opacity-90 transition-opacity`}
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>

            <div
              className="bg-[#0e0e0e] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 mb-3 cursor-pointer hover:border-zinc-700"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Link has been copied to the clipboard!");
              }}
              title="Click to copy"
            >
              {shareUrl}
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={shorten}
                onChange={(e) => setShorten(e.target.checked)}
                className="accent-[#f50]"
              />
              Shorten link
            </label>
          </div>
        )}

        {tab === "message" && (
          <div className="p-6">
            <p className="text-zinc-400 text-sm">
              Direct messaging is coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}