"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTrackComments } from "@/src/services/interactionService";
import type { TrackComment } from "@/src/types/interactions";

type SortOption = "newest" | "oldest" | "trackTime";

interface TrackCommentsSectionProps {
    trackId: string;
    enabled?: boolean;
    refreshKey?: number;
}

function formatTimestamp(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatCreatedAt(iso: string) {
    if (!iso) return "unknown time";

    const createdTime = new Date(iso).getTime();
    if (!Number.isFinite(createdTime)) return "unknown time";

    const diff = Date.now() - createdTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
}

export default function TrackCommentsSection({
    trackId,
    enabled = true,
    refreshKey = 0,
}: TrackCommentsSectionProps) {
    const [comments, setComments] = useState<TrackComment[]>([]);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        async function loadComments() {
            try {
                setIsLoading(true);
                const data = await getTrackComments(trackId, 1, 100);

                if (cancelled) return;

                console.table(
                    data.comments.map((comment) => ({
                        text: comment.text,
                        timestampSeconds: comment.timestampSeconds,
                        createdAt: comment.createdAt,
                    }))
                );

                setComments(data.comments);
                setTotal(data.total ?? data.comments.length);
            } catch (error) {
                console.error("Failed to load comments:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void loadComments();

        return () => {
            cancelled = true;
        };
    }, [trackId, enabled, refreshKey]);

    function getCreatedTime(comment: TrackComment) {
        const time = new Date(comment.createdAt).getTime();
        return Number.isFinite(time) ? time : 0;
    }

    const sortedComments = useMemo(() => {
        const copy = [...comments];

        if (sortBy === "newest") {
            return copy.sort((a, b) => {
                const createdDiff = getCreatedTime(b) - getCreatedTime(a);
                if (createdDiff !== 0) return createdDiff;

                // fallback if createdAt is identical
                return b.timestampSeconds - a.timestampSeconds;
            });
        }

        if (sortBy === "oldest") {
            return copy.sort((a, b) => {
                const createdDiff = getCreatedTime(a) - getCreatedTime(b);
                if (createdDiff !== 0) return createdDiff;

                // fallback if createdAt is identical
                return a.timestampSeconds - b.timestampSeconds;
            });
        }

        return copy.sort((a, b) => {
            const timestampDiff = a.timestampSeconds - b.timestampSeconds;
            if (timestampDiff !== 0) return timestampDiff;

            // fallback if two comments are at the same track timestamp
            return getCreatedTime(a) - getCreatedTime(b);
        });
    }, [comments, sortBy]);

    const sortLabel =
        sortBy === "newest"
            ? "Newest"
            : sortBy === "oldest"
                ? "Oldest"
                : "Track Time";

    return (
        <section className="bg-[#121212] text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold">
                    {total.toLocaleString()} comments
                </h2>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2 rounded bg-[#2a2a2a] px-4 py-2 text-sm font-bold hover:bg-[#333]"
                    >
                        Sorted by: {sortLabel}
                        <ChevronDown
                            size={18}
                            className={`transition ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-11 z-20 w-48 rounded border border-[#333] bg-[#151515] py-2 shadow-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setSortBy("newest");
                                    setIsDropdownOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm font-bold hover:bg-[#2a2a2a]"
                            >
                                Newest
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSortBy("oldest");
                                    setIsDropdownOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm font-bold text-zinc-400 hover:bg-[#2a2a2a] hover:text-white"
                            >
                                Oldest
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSortBy("trackTime");
                                    setIsDropdownOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm font-bold text-zinc-400 hover:bg-[#2a2a2a] hover:text-white"
                            >
                                Track Time
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isLoading && (
                <p className="text-sm text-zinc-400">Loading comments...</p>
            )}

            {!isLoading && sortedComments.length === 0 && (
                <p className="text-sm text-zinc-500">No comments yet.</p>
            )}

            <div className="space-y-8">
                {sortedComments.map((comment) => (
                    <article key={comment.commentId} className="flex gap-3">
                        {comment.user.avatarUrl ? (
                            <img
                                src={comment.user.avatarUrl}
                                alt={comment.user.display_name}
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-10 w-10 shrink-0 rounded-full bg-[#c77c73]" />
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-1 text-sm">
                                <span className="font-bold text-white">
                                    {comment.user.display_name}
                                </span>

                                <span className="font-bold text-zinc-400">
                                    at {formatTimestamp(comment.timestampSeconds)}
                                </span>

                                <span className="text-zinc-400">·</span>

                                <span className="font-bold text-zinc-400">
                                    {formatCreatedAt(comment.createdAt)}
                                </span>
                            </div>

                            <p className="break-words text-sm text-white">{comment.text}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}