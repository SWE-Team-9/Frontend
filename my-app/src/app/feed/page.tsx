"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import {
    getFeed,
    type FeedItem,
    type FeedPagination,
} from "@/src/services/feedService";
import Link from "next/link";

const FALLBACK_AVATAR = "/images/profile.png";

function timeAgo(date?: string) {
    if (!date) return "";

    const time = new Date(date).getTime();
    if (Number.isNaN(time)) return "";

    const diffMs = Date.now() - time;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Posted just now";
    if (diffMinutes < 60) {
        return `Posted ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }
    if (diffHours < 24) {
        return `Posted ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    return `Posted ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function FeedSkeleton() {
    return (
        <div className="space-y-10">
            {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-700" />
                        <div className="h-4 w-64 rounded bg-zinc-700" />
                    </div>

                    <div className="flex gap-6 rounded-lg bg-[#1e1e1e] p-5">
                        <div className="h-40 w-40 shrink-0 rounded-md bg-zinc-700" />

                        <div className="flex flex-1 flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-zinc-700" />
                                <div className="space-y-2">
                                    <div className="h-4 w-28 rounded bg-zinc-700" />
                                    <div className="h-6 w-52 rounded bg-zinc-700" />
                                </div>
                            </div>

                            <div className="h-16 w-full rounded bg-zinc-700" />

                            <div className="flex gap-3">
                                <div className="h-7 w-20 rounded bg-zinc-700" />
                                <div className="h-7 w-20 rounded bg-zinc-700" />
                                <div className="h-7 w-20 rounded bg-zinc-700" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function FeedPage() {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [pagination, setPagination] = useState<FeedPagination | null>(null);
    const [page, setPage] = useState(1);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadFeed = useCallback(async (nextPage = 1, append = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsInitialLoading(true);
            }

            setError(null);

            const response = await getFeed(nextPage, 20);

            setItems((prev) =>
                append ? [...prev, ...response.data] : response.data,
            );

            setPagination(response.pagination);
            setPage(nextPage);
        } catch (err) {
            console.error("Failed to load feed:", err);
            setError("Failed to load your feed. Please try again.");
        } finally {
            setIsInitialLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (cancelled) return;
            await loadFeed(1, false);
        })();
        return () => {
            cancelled = true;
        };
    }, [loadFeed]);

    const lastItemRef = useCallback(
        (node: HTMLElement | null) => {
            if (isInitialLoading || isLoadingMore) return;

            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const firstEntry = entries[0];

                    if (
                        firstEntry.isIntersecting &&
                        pagination?.hasNextPage &&
                        !isLoadingMore
                    ) {
                        loadFeed(page + 1, true);
                    }
                },
                {
                    root: null,
                    rootMargin: "300px",
                    threshold: 0,
                },
            );

            if (node) {
                observerRef.current.observe(node);
            }
        },
        [
            isInitialLoading,
            isLoadingMore,
            pagination?.hasNextPage,
            page,
            loadFeed,
        ],
    );

    return (
        <section className="mx-auto max-w-5xl px-6 py-6 text-white">
            <h1 className="mb-8 text-2xl font-bold">
                Hear the latest posts from the people you’re following:
            </h1>

            {isInitialLoading && <FeedSkeleton />}


            {error && !isInitialLoading && (
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}

            {!isInitialLoading && !error && items.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-800 py-20 text-center">
                    <p className="text-zinc-500">
                        No posts yet. Follow some artists to see their latest tracks here.
                    </p>
                </div>
            )}

            {!isInitialLoading && !error && items.length > 0 && (
                <div className="space-y-10">
                    {items.map((item, index) => {
                        const profile = item.uploader?.profile;

                        const displayName =
                            profile?.displayName || profile?.handle || "Unknown Artist";

                        const isLastItem = index === items.length - 1;

                        return (
                            <article
                                key={item.id}
                                ref={isLastItem ? lastItemRef : undefined}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    {profile?.handle ? (
                                        <Link href={`/profiles/${profile.handle}`} className="shrink-0">
                                            <Image
                                                src={profile?.avatarUrl || FALLBACK_AVATAR}
                                                alt={displayName}
                                                width={36}
                                                height={36}
                                                className="h-9 w-9 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = FALLBACK_AVATAR;
                                                }}
                                            />
                                        </Link>
                                    ) : (
                                        <Image
                                            src={profile?.avatarUrl || FALLBACK_AVATAR}
                                            alt={displayName}
                                            width={36}
                                            height={36}
                                            className="h-9 w-9 rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_AVATAR;
                                            }}
                                        />
                                    )}

                                    <p className="text-sm text-zinc-400">
                                        {profile?.handle ? (
                                            <Link
                                                href={`/profiles/${profile.handle}`}
                                                className="font-bold text-white hover:text-zinc-600 transition-colors"
                                            >
                                                {displayName}
                                            </Link>
                                        ) : (
                                            <span className="font-bold text-white">{displayName}</span>
                                        )}{" "}
                                        posted a track{" "}
                                        <span>{timeAgo(item.publishedAt || item.createdAt)}</span>
                                    </p>
                                </div>

                                <TrackCard
                                    track={{
                                        trackId: item.id,
                                        title: item.title,
                                        slug: item.slug,
                                        description: item.description,

                                        coverArtUrl: item.coverArtUrl ?? undefined,

                                        status: item.status,
                                        visibility: item.visibility,

                                        durationMs: item.durationMs,
                                        genre: item.genre,
                                        tags: item.tags,
                                        waveformData: item.waveformData ?? null,

                                        likesCount: item.likesCount ?? 0,
                                        liked: item.liked ?? false,
                                        repostsCount: item.repostsCount ?? 0,
                                        reposted: item.reposted ?? false,

                                        artistName: displayName,
                                        artistId: item.uploaderId,
                                        artistHandle: profile?.handle,
                                        artistAvatarUrl: profile?.avatarUrl ?? null,
                                    }}
                                    isOwner={false}
                                />
                            </article>
                        );
                    })}

                    {isLoadingMore && (
                        <div className="flex justify-center py-6">
                            <p className="animate-pulse text-sm uppercase tracking-widest text-zinc-400">
                                Loading more...
                            </p>
                        </div>
                    )}

                    {!pagination?.hasNextPage && items.length > 0 && (
                        <p className="py-6 text-center text-sm text-zinc-500">
                            You’re all caught up.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}