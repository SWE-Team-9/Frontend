"use client";

import { useEffect, useState } from "react";
import { searchService } from "@/src/services/searchService";
import type { SearchResponse } from "@/src/types/search";

interface Options {
  enabled?: boolean;
  type?: "all" | "tracks" | "users" | "playlists";
  page?: number;
  limit?: number;
}

export function useSearch(query: string, options: Options = {}) {
  const { enabled = true, type = "all", page = 1, limit = 10 } = options;

  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!enabled || !query.trim()) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await searchService.search({q: query, type, page, limit });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [query, enabled, type, page, limit]);

  return { data, loading, error };
}