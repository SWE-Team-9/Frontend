"use client";

import { useState, useEffect } from "react";
import {
  getProfilePageData,
  ProfilePageData,
} from "@/src/services/bffService";

// ─────────────────────────────────────────────────────────────
// useProfilePageData
//
// Fetches all profile-page data in one request via the BFF
// aggregate endpoint GET /pages/profile/:handle.
//
// Returns: profile, tracks (page 1), viewer relationship,
// viewer interactions (liked/reposted ids), and permissions.
//
// The hook is safe to call for both guests and authenticated
// users — the backend injects viewer state only when a valid
// session cookie is present.
// ─────────────────────────────────────────────────────────────

export interface UseProfilePageDataResult {
  data: ProfilePageData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProfilePageData(handle: string): UseProfilePageDataResult {
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const result = await getProfilePageData(handle);
        if (!cancelled) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load profile.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, refreshKey]);

  return {
    data,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
