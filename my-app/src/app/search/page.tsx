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
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold">
        Results for <span className="text-orange-500">&quot;{q}&quot;</span>
      </h1>
      {data && (
        <p className="mb-4 text-sm text-gray-500">
          {data.meta.total_results} result
          {data.meta.total_results === 1 ? "" : "s"} found
        </p>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParam("type", t.key)}
            className={`px-4 py-2 text-sm transition-colors ${
              type === t.key
                ? "border-b-2 border-orange-500 font-semibold text-orange-500"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && <ResultsSkeleton />}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          Something went wrong: {error}
        </div>
      )}

      {/* Results */}
      {data && !loading && !error && (
        <>
          {/* No results at all */}
          {data.data.tracks.length === 0 &&
            data.data.users.length === 0 &&
            data.data.playlists.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <p className="text-lg font-medium">No results found</p>
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

          {/* Pagination — only meaningful inside a single-type tab */}
          {type !== "all" && data.meta.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setParam("page", String(page - 1))}
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {data.meta.current_page} of {data.meta.total_pages}
              </span>
              <button
                disabled={page >= data.meta.total_pages}
                onClick={() => setParam("page", String(page + 1))}
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
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
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>
      <div className="space-y-1">{children}</div>
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