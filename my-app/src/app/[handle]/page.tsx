"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useResolvePermalink } from "@/src/hooks/useResolvePermalink";

interface Props {
  params: Promise<{ handle: string }>;
}

export default function HandlePage({ params }: Props) {
  const { handle } = use(params);
  const router = useRouter();

  const { data, loading, error } = useResolvePermalink(handle);

  useEffect(() => {
    if (!data) return;

    if (!data.matched) {
      router.replace("/404");
      return;
    }

    switch (data.resourceType) {
      case "USER":
        router.replace(`/profiles/${handle}`);
        break;
      case "TRACK":
        router.replace(`/tracks/${data.id}`);
        break;
      case "PLAYLIST":
        router.replace(`/playlists/${data.id}`);
        break;
    }
  }, [data, router, handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse uppercase tracking-widest text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500">Profile not found.</p>
      </div>
    );
  }

  return null;
}