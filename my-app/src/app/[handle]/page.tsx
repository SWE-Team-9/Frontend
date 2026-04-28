"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useResolvePermalink } from "@/src/hooks/useResolvePermalink";

export default function HandleResolverPage() {
  const router = useRouter();
  const params = useParams<{ handle: string }>();
  const permalink = `/${params.handle}`;

  const { data, loading, error } = useResolvePermalink(permalink);

  useEffect(() => {
    if (!data) return;
    switch (data.type) {
      case "USER":
        router.replace(`/profiles/${params.handle}`);
        break;
      case "TRACK":
        router.replace(`/tracks/${data.resource_id}`);
        break;
      case "PLAYLIST":
        router.replace(`/playlists/${data.resource_id}`);
        break;
    }
  }, [data, router, params.handle]);

  if (loading) return <div className="p-8">Resolving link…</div>;
  if (error)   return <div className="p-8 text-red-500">Link not found.</div>;
  return null;
}