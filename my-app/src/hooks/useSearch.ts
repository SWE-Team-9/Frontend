"use client";
import { useEffect, useState } from "react";
import { searchService } from "@/src/services/searchService";
import type { SearchResponse, SearchType } from "@/src/types/search";

interface Options {
  type?: SearchType;
  page?: number;
  enabled?: boolean;
}

export function useSearch(query: string, opts: Options = {}) {
  const { type = "all", page = 1, enabled = true } = opts;
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    searchService
      .search({ q: query, type, page })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, type, page, enabled]);

  return { data, loading, error };
}