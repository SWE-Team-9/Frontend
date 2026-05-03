"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFollowStore } from "@/src/store/followStore";

type FollowUserShape = {
  id: string;
  handle?: string;
  display_name?: string;
  displayName?: string;
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  avatar?: string;
};

interface FollowingUsersGridProps {
  userId: string;
}

const FOLLOW_LIMIT = 20;

export default function FollowingUsersGrid({ userId }: FollowingUsersGridProps) {
  const following = useFollowStore((state) => state.profileFollowing || []);
  const fetchFollowing = useFollowStore((state) => state.fetchFollowing);
  const toggleFollow = useFollowStore((state) => state.toggleFollow);
  const checkIsFollowing = useFollowStore((state) => state.isFollowing);

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!userId) return;

    useFollowStore.setState({ profileFollowing: [] });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchFollowing as any)(userId, {
      syncProfileList: true,
      page,
      limit: FOLLOW_LIMIT,
    });
  }, [userId, page, fetchFollowing]);

  if (following.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold text-zinc-600 uppercase">
          Not following anyone yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {(following as FollowUserShape[]).map((user) => {
          const name = user.display_name || user.displayName || user.name || "";
          const avatar = user.avatar_url || user.avatarUrl || user.avatar || null;
          const isFollowing = checkIsFollowing(user.id);

          return (
            <div
              key={`following-${user.id}`}
              className="flex flex-col items-center text-center group"
            >
              <Link
                href={user.handle ? `/profiles/${user.handle}` : "#"}
                className="flex flex-col items-center"
              >
                <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all shadow-2xl bg-zinc-900">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-3xl font-bold text-zinc-500 uppercase">
                        {name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-white text-sm uppercase mb-1">
                  {name}
                </h4>
              </Link>

              <button
                onClick={() =>
                  toggleFollow({
                    id: user.id,
                    display_name: name,
                    handle: user.handle ?? "",
                    avatar_url: avatar ?? "",
                  })
                }
                className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                  isFollowing
                    ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center gap-6 mt-12">
        <button
          disabled={page === 1}
          onClick={() => {
            setPage((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
        >
          Previous
        </button>

        <span className="text-white font-black text-sm uppercase tracking-widest">
          Page {page}
        </span>

        <button
          disabled={following.length < FOLLOW_LIMIT}
          onClick={() => {
            setPage((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}