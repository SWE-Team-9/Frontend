import React from "react";

// ─────────────────────────────────────────────────────────────
// A single row in the "Your links" section of the Edit Profile
// modal. Each link has a platform name (e.g. "instagram") and
// a URL.
// ─────────────────────────────────────────────────────────────

interface SocialLinkInputProps {
  link: { id: number; platform: string; url: string };
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export const SocialLinkInput = ({
  link,
  onRemove,
  onChange,
}: SocialLinkInputProps) => (
  <div className="flex items-center gap-3 w-full mb-2">
    <input
      className="flex-2 bg-[#222] p-2 rounded text-zinc-300 font-bold outline-none focus:border-zinc-500"
      placeholder="https://..."
      value={link.url}
      onChange={(e) => onChange(link.id, "url", e.target.value)}
    />
    <input
      className="flex-1 bg-[#222] p-2 rounded text-zinc-300 font-bold outline-none focus:border-zinc-500"
      placeholder="Platform (e.g. instagram)"
      value={link.platform}
      onChange={(e) => onChange(link.id, "platform", e.target.value)}
    />
    <button
      type="button"
      onClick={() => onRemove(link.id)}
      className="text-red-500 font-bold p-2"
    >
      🗑️
    </button>
  </div>
);
