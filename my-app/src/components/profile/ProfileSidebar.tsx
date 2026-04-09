import React from "react";
import Image from "next/image";
import { Stats } from "./sidebar/Stats";
import { useLikeStore } from '@/src/store/likeStore';
import { Heart } from 'lucide-react';

interface SidebarUser {
  id: number | string;
  name: string;
  followers: string | number;
  avatar: string;
  tracks?: string | number;
}

interface ProfileSidebarProps {
  followingCount: number;
  followersCount: number;
  tracksCount: number;
  displayUsers: SidebarUser[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links: any[];
  favoriteGenres?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleFollow: (id: any) => void;
  setViewState: (view: string) => void;
  setDetailTab: (tab: string) => void;
}

export const ProfileSidebar = ({
  followingCount, followersCount, tracksCount, displayUsers, links, favoriteGenres, toggleFollow, setViewState, setDetailTab,
}: ProfileSidebarProps) => {
  
  const likedTracks = useLikeStore((state) => state.likedTracks || []);

  return (
    <div className="w-full lg:w-[320px] flex flex-col text-left">
      <div className="mb-10">
        <Stats followers={followersCount} following={followingCount} tracks={tracksCount} />
      </div>

      {/* --- LIKED TRACKS SECTION --- */}
      <div className="space-y-5 border-t border-zinc-900 pt-6 mb-10">
        <div className="flex justify-between items-center text-zinc-500 text-[13px]">
          <p className="font-bold uppercase tracking-tight flex items-center gap-2">
            <Heart size={14} className={likedTracks.length > 0 ? "fill-zinc-500" : ""} /> {likedTracks.length} Likes
          </p>
          <button onClick={() => { setViewState("details"); setDetailTab("Likes"); }} className="hover:text-white font-bold text-xs uppercase transition-colors">
            View all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {likedTracks.length === 0 ? (
            <p className="text-zinc-600 text-xs italic py-2">No tracks liked yet.</p>
          ) : (
            likedTracks.slice(-3).reverse().map((track) => {
              const img = track.coverArt || track.imageUrl;
              return (
                <div key={track.id} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-zinc-800 rounded shrink-0 border border-zinc-800/50 overflow-hidden relative">
                    {img ? (
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                         <Heart size={10} className="text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 grow">
                    <p className="text-zinc-200 text-[13px] truncate font-medium group-hover:text-[#f50] transition-colors">{track.title}</p>
                    <p className="text-zinc-500 text-[11px] uppercase tracking-tighter">{track.artistName || "Unknown Artist"}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- FOLLOWING LIST --- */}
      <div className="space-y-5 border-t border-zinc-900 pt-6">
        <div className="flex justify-between items-center text-zinc-500 text-[13px]">
          <p className="font-bold uppercase tracking-tight">{followingCount} Following</p>
          <button onClick={() => { setViewState("details"); setDetailTab("Following"); }} className="hover:text-white font-bold text-xs uppercase">View all</button>
        </div>
        <div className="space-y-4">
          {displayUsers.slice(0, 3).map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden relative border border-zinc-800 bg-zinc-800">
                  <Image src={user.avatar || "/Blossom.png"} alt={user.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-white font-bold text-[13px]">{user.name} <span className="text-[#38bdf8] text-[10px]">✓</span></p>
                  <p className="text-zinc-500 text-[11px]">👤 {user.followers} ||| {user.tracks || 0}</p>
                </div>
              </div>
              <button onClick={() => toggleFollow(user.id)} className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded text-[11px] font-bold uppercase hover:border-white">Following</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};