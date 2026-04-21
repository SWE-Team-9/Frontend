"use client";
import { useEffect, useState } from "react";
import { resolverService } from "@/src/services/resolverService";
import type { ResolveResponse } from "@/src/types/resolver";

export function useResolvePermalink(permalink: string | null) {
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permalink) return;
    setLoading(true);
    setError(null);
    resolverService
      .resolve(permalink)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [permalink]);

  return { data, loading, error };
}