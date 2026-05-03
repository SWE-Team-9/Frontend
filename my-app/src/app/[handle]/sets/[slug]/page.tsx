"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useResolvePermalink } from "@/src/hooks/useResolvePermalink";

export default function PlaylistPermalinkResolverPage() {
  const router = useRouter();
  const params = useParams<{ handle: string; slug: string }>();
  const permalink = `${params.handle}/sets/${params.slug}`;

  const { data, loading, error } = useResolvePermalink(permalink);

  useEffect(() => {
    if (!data) return;

    if (!data.matched) {
      router.replace("/404");
      return;
    }

    switch (data.resourceType) {
      case "PLAYLIST":
        router.replace(`/library/playlists/${data.id}`);  // ← was /playlists/
        break;
      case "TRACK":
        router.replace(`/tracks/${data.id}`);
        break;
      case "USER":
        router.replace(`/profiles/${params.handle}`);
        break;
    }
  }, [data, router, params.handle]);

  if (loading) return <div className="p-8">Resolving link…</div>;
  if (error) return <div className="p-8 text-red-500">Link not found.</div>;
  return null;
}