"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useSearch } from "@/src/hooks/useSearch";
import SearchQuickResults from "@/src/components/search/SearchQuickResults";

export default function SearchBar() {
  const [query, setQuery] = useState(""); // what the user is currently typing, character by character
  const [open, setOpen] = useState(false); // whether the quick results dropdown is open
  const router = useRouter();
  const debounced = useDebounce(query, 300);
  const { data, loading } = useSearch(debounced, { enabled: debounced.length > 1 });
  const ref = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={submit}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tracks, people, playlists"
          className="w-full rounded-md border px-3 py-2"
        />
      </form>

      {open && debounced.length > 1 && (
        <SearchQuickResults
          query={debounced}
          data={data}
          loading={loading}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}