"use client";

import LibraryTabs from "@/src/components/library/LibraryTabs";
import FollowingUsersGrid from "@/src/components/profile/FollowingUsersGrid";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function LibraryFollowingPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <LibraryTabs />

      <div className="mt-8">
        {!user?.id ? (
          <p className="text-sm text-zinc-500">Loading following...</p>
        ) : (
          <FollowingUsersGrid userId={user.id} />
        )}
      </div>
    </div>
  );
}