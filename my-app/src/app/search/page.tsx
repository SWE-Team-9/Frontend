"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch } from "@/src/hooks/useSearch";
import type { SearchType } from "@/src/types/search";
import TrackResultCard from "@/src/components/search/results/TrackResultCard";
import UserResultCard from "@/src/components/search/results/UserResultCard";
import PlaylistResultCard from "@/src/components/search/results/PlaylistResultCard";

const TABS: { key: SearchType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tracks", label: "Tracks" },
  { key: "users", label: "People" },
  { key: "playlists", label: "Playlists" },
];

function SearchPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  //========================
  // Read state from the URL
  //========================
  const q = sp.get("q") ?? "";
  const type = (sp.get("type") as SearchType) ?? "all";
  const page = Number(sp.get("page") ?? 1);

  //======================
  //  Fetch results
  //======================
  const { data, loading, error } = useSearch(q, {
    type,
    page,
    enabled: q.trim().length > 0,
  });

  //========================================
  //  Update a single URL param and navigate
  //========================================
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set(key, value);
    // Reset to page 1 whenever the tab or query changes
    if (key !== "page") next.set("page", "1");
    router.push(`/search?${next.toString()}`);
  };

  //======================
  //  Empty query state
  //======================
  if (!q.trim()) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Search</h1>
        <p>Type something in the search bar above to get started.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="mx-auto max-w-300 px-8 py-6">
        {/* Header */}
        <h1 className="mb-1 text-2xl font-bold">
          Search results for &quot;{q}&quot;
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          {data
            ? `${data.meta.total_results} result${
                data.meta.total_results === 1 ? "" : "s"
              } found`
            : "\u00A0"}
        </p>
        {/* Two-column layout: sidebar + results */}
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="w-70 shrink-0">
            <nav className="flex flex-col gap-1">
              {TABS.map((t) => {
                const active = type === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setParam("type", t.key)}
                    className={`rounded-md px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      active
                        ? "bg-white text-black"
                        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </aside>
          {/* Results column */}
          <div className="min-w-0 flex-1">
            {loading && <ResultsSkeleton />}
            {error && !loading && (
              <div className="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-red-400">
                Something went wrong: {error}
              </div>
            )}
            {data && !loading && !error && (
              <>
                {/* No results at all */}
                {data.data.tracks.length === 0 &&
                  data.data.users.length === 0 &&
                  data.data.playlists.length === 0 && (
                    <div className="py-16 text-center text-neutral-500">
                      <p className="text-lg font-medium text-neutral-400">
                        No results found
                      </p>
                      <p className="mt-1 text-sm">
                        Try a different keyword or remove filters.
                      </p>
                    </div>
                  )}
                {/* Tracks */}
                {(type === "all" || type === "tracks") &&
                  data.data.tracks.length > 0 && (
                    <Section title="Tracks">
                      {data.data.tracks.map((t) => (
                        <TrackResultCard key={t.id} track={t} />
                      ))}
                    </Section>
                  )}
                {/* People */}
                {(type === "all" || type === "users") &&
                  data.data.users.length > 0 && (
                    <Section title="People">
                      {data.data.users.map((u) => (
                        <UserResultCard key={u.id} user={u} />
                      ))}
                    </Section>
                  )}
                {/* Playlists */}
                {(type === "all" || type === "playlists") &&
                  data.data.playlists.length > 0 && (
                    <Section title="Playlists">
                      {data.data.playlists.map((p) => (
                        <PlaylistResultCard key={p.id} playlist={p} />
                      ))}
                    </Section>
                  )}
                {/* Pagination */}
                {type !== "all" && data.meta.total_pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      disabled={page <= 1}
                      onClick={() => setParam("page", String(page - 1))}
                      className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-neutral-400">
                      Page {data.meta.current_page} of {data.meta.total_pages}
                    </span>
                    <button
                      disabled={page >= data.meta.total_pages}
                      onClick={() => setParam("page", String(page + 1))}
                      className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

//======================
// Local subcomponents
//======================
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-[#ff5500] pl-6">{title}</h2>
      <div className="space-y-1 pl-6">{children}</div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded p-2"
        >
          <div className="h-14 w-14 rounded bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-1/5 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  );
}
