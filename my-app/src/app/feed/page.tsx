"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import { getFeed, type FeedItem, type FeedPagination } from "@/src/services/feedService";

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

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [pagination, setPagination] = useState<FeedPagination | null>(null);
  const [page, setPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = async (nextPage = 1, append = false) => {
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
  };

  useEffect(() => {
    loadFeed(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!pagination?.hasNextPage || isLoadingMore) return;
    loadFeed(page + 1, true);
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-6 text-white">
      <h1 className="mb-8 text-2xl font-bold">
        Hear the latest posts from the people you’re following:
      </h1>

      {isInitialLoading && (
        <div className="flex justify-center py-20">
          <p className="animate-pulse text-sm uppercase tracking-widest text-zinc-400">
            Loading feed...
          </p>
        </div>
      )}

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
          {items.map((item) => {
            const profile = item.uploader?.profile;

            const displayName =
              profile?.displayName || profile?.handle || "Unknown Artist";

            return (
              <article key={item.id} className="space-y-3">
                <div className="flex items-center gap-3">
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

                  <p className="text-sm text-zinc-400">
                    <span className="font-bold text-white">{displayName}</span>{" "}
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

          {pagination?.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}