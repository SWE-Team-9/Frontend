"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { messageService } from "@/src/services/messageService";
import type { AttachResource } from "@/src/types/messages";

const FALLBACK = "/images/track-placeholder.png";

export default function AttachResourcePicker({
  onSelect,
}: {
  onSelect: (resource: AttachResource) => void;
}) {
  const [items, setItems] = useState<AttachResource[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    messageService.getMockAttachResources().then(setItems);
  }, []);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mt-3 rounded border border-zinc-700 bg-[#1e1e1e]">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Select a track or playlist from your profile"
        className="w-full border-b border-zinc-700 bg-transparent px-3 py-2 text-sm text-white outline-none"
      />

      <div className="max-h-48 overflow-y-auto">
        {filtered.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded bg-zinc-800">
              <Image
                src={item.coverArtUrl || FALLBACK}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.type}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}