"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useSearch } from "@/src/hooks/useSearch";
import SearchQuickResults from "./SearchQuickResults";

export default function SearchBar() {
  const [query, setQuery] = useState(""); // what the user is currently typing, character by character
  const [open, setOpen] = useState(false); // whether the quick results dropdown is open
  const router = useRouter();
  const debounced = useDebounce(query, 300);
  const { data, loading } = useSearch(debounced, {
    enabled: debounced.length > 1,
  });
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
    <div ref={ref} className="relative w-full">
      <form onSubmit={submit}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search"
          className="w-full bg-neutral-800 text-white text-sm px-4 py-1 pr-9 rounded-md outline-none placeholder:text-neutral-500"
        />
        <FiSearch
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          size={18}
        />
      </form>

      {open && debounced.length > 1 && (
        <SearchQuickResults
          query={debounced}
          data={data}
          loading={loading}
          onClose={() => {
            setOpen(false);
            setQuery("");
          }}
        />
      )}
    </div>
  );
}