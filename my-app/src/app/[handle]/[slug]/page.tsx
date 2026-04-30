"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useResolvePermalink } from "@/src/hooks/useResolvePermalink";

export default function PermalinkResolverPage() {
  const router = useRouter();
  const params = useParams<{ handle: string; slug: string }>();
  const permalink = `${params.handle}/${params.slug}`;

  const { data, loading, error } = useResolvePermalink(permalink);

  useEffect(() => {
    if (!data) return;
    switch (data.resourceType) {
      case "USER":
        router.replace(`/profiles/${params.handle}`);
        break;
      case "TRACK":
        router.replace(`/tracks/${data.id}`);
        break;
      case "PLAYLIST":
        router.replace(`/playlists/${data.id}`);
        break;
    }
  }, [data, router, params.handle]);

  if (loading) return <div className="p-8">Resolving link…</div>;
  if (error) return <div className="p-8 text-red-500">Link not found.</div>;
  return null;
}
