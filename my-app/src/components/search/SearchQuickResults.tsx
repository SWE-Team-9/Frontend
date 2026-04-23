"use client";

import Link from "next/link";
import type { SearchResponse } from "@/src/types/search";

interface Props {
  query: string;
  data: SearchResponse | null;
  loading: boolean;
  onClose: () => void;
}

export default function SearchQuickResults({
  query,
  data,
  loading,
  onClose,
}: Props) {
  if (loading) return <Panel>Searching…</Panel>;
  if (!data) return null;

  const { users, tracks, playlists } = data.data;
  const empty = !users.length && !tracks.length && !playlists.length;
  if (empty) return <Panel>No results for &quot;{query}&quot;</Panel>;

  return (
    <Panel>
      {tracks.length > 0 && (
        <Section title="Tracks">
          {tracks.slice(0, 3).map((t) => (
            <Link
              key={t.id}
              href={`/tracks/${t.id}`}
              onClick={onClose}
              className="block py-1 hover:text-orange-500"
            >
              {t.title}
            </Link>
          ))}
        </Section>
      )}

      {users.length > 0 && (
        <Section title="People">
          {users.slice(0, 3).map((u) => (
            <Link
              key={u.id}
              href={`/profiles/${u.handle ?? u.id}`}
              onClick={onClose}
              className="block py-1 hover:text-orange-500"
            >
              {u.display_name}
            </Link>
          ))}
        </Section>
      )}

      {playlists.length > 0 && (
        <Section title="Playlists">
          {playlists.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/playlists/${p.id}`}
              onClick={onClose}
              className="block py-1 hover:text-orange-500"
            >
              {p.title}
            </Link>
          ))}
        </Section>
      )}

      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onClick={onClose}
        className="mt-2 block border-t pt-2 text-sm font-semibold text-orange-500"
      >
        See all results →
      </Link>
    </Panel>
  );
}

//======================
//  Helper components
//======================

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute z-50 mt-2 w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 shadow-lg text-sm text-neutral-300">
      {children}
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </div>
      {children}
    </div>
  );
}
