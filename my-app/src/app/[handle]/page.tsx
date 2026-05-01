"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useResolvePermalink } from "@/src/hooks/useResolvePermalink";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

export default function PlaylistBySlugPage({ params }: Props) {
  const { handle, slug } = use(params);
  const router = useRouter();

  const permalink = `/${handle}/sets/${slug}`;
  const { data, loading, error } = useResolvePermalink(permalink);

  useEffect(() => {
    if (!data) return;

    if (data.matched && data.resourceType === "PLAYLIST" && data.id) {
      router.replace(`/playlists/${data.id}`);
    }
  }, [data, router]);

  if (loading || (data?.matched && data.resourceType === "PLAYLIST")) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse uppercase tracking-widest text-sm">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <p className="text-zinc-500">Playlist not found.</p>
    </div>
  );
}