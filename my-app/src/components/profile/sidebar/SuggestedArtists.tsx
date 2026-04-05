"use client";

import { useEffect, useState } from "react";
import { getSuggestions } from "@/src/services/socialService";
import { User } from "@/src/types/user";
import { UserCard } from "@/src/components/user/UserCard"; // import

export default function SuggestedArtists() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await getSuggestions();
        const suggestions = data.data?.suggestions || [];

        const mappedUsers: User[] = suggestions.map((u: any) => ({
          id: u.id,
          name: u.display_name,
          avatar: u.avatar_url,
        }));

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return (
    <div className="space-y-4">
      
      {/*  Loading State */}
      {loading && (
        <p className="text-sm text-zinc-500">Loading...</p>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <p className="text-sm text-zinc-500">
          No suggestions available
        </p>
      )}

      {/*  Suggestions List using UserCard */}
      {users.map((user) => (
        <UserCard
          key={user.id}
          compact //  important for sidebar layout
          user={{
            userId: user.id,
            displayName: user.name,
            avatarUrl: user.avatar,
          }}
        />
      ))}
    </div>
  );
}