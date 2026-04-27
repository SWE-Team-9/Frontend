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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadResources() {
            try {
                const data = await messageService.getMockAttachResources();
                if (!isMounted) return;

                setItems(data);
                setError(null);
            } catch {
                if (!isMounted) return;
                setError("Could not load your tracks and playlists.");
            } finally {
                if (!isMounted) return;
                setIsLoading(false);
            }
        }

        loadResources();

        return () => {
            isMounted = false;
        };
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
                {isLoading && (
                    <p className="px-3 py-3 text-sm text-zinc-500">
                        Loading your tracks and playlists...
                    </p>
                )}

                {error && !isLoading && (
                    <p className="px-3 py-3 text-sm text-red-300">{error}</p>
                )}

                {!isLoading && !error && items.length === 0 && (
                    <p className="px-3 py-3 text-sm text-zinc-500">
                        You do not have any tracks or playlists to attach yet.
                    </p>
                )}

                {!isLoading && !error && items.length > 0 && filtered.length === 0 && (
                    <p className="px-3 py-3 text-sm text-zinc-500">
                        No tracks or playlists match your search.
                    </p>
                )}

                {!isLoading &&
                    !error &&
                    filtered.map((item) => (
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