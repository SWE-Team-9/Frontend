"use client";

import { useEffect, useState } from "react";
import { resolverService } from "@/src/services/resolverService";
import type { ResolveResponse } from "@/src/types/resolver";

export function useResolvePermalink(permalink: string | null) {
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permalink) return;

    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setError(null);

      try {
        const result = await resolverService.resolve(permalink);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to resolve link");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [permalink]);

  return { data, loading, error };
}