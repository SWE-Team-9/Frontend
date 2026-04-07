"use client";

import { useEffect} from "react";
import { useFollowStore } from "@/src/store/followStore";
import { UserCard } from "@/src/components/user/UserCard";

export default function SuggestedArtists() {
  const { suggestions, suggestionsLoading, fetchSuggestions, error } =
    useFollowStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return (
    <div className="space-y-4">
      {suggestionsLoading && (
        <p className="text-sm text-zinc-500">Loading...</p>
      )}

      {!suggestionsLoading && suggestions.length === 0 && (
        <p className="text-sm text-zinc-500">No suggestions available</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {suggestions.map((user) => (
        <UserCard
          key={user.id}
          compact
          user={{
            userId: user.id,
            displayName: user.display_name,
            handle: user.handle,
            avatarUrl: user.avatar_url,
          }}
        />
      ))}
    </div>
  );
}
