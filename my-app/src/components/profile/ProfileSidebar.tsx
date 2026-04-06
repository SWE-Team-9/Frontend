import React from "react";
import Image from "next/image";
import { Stats } from "./sidebar/Stats";
import { SocialLinksList } from "./sidebar/SocialLinksList";
import { useLikeStore } from '@/src/store/likeStore';
import { Heart } from 'lucide-react';


interface SidebarUser {
  id: number;
  name: string;
  followers: string;
  avatar: string;
}

interface SidebarSocialLink {
  id: number;
  platform: string;
  url: string;
}

interface ProfileSidebarProps {
  followingCount: number;
  followersCount: number;
  tracksCount: number;
  displayUsers: SidebarUser[];
  links: SidebarSocialLink[];
  favoriteGenres?: string[];
  toggleFollow: (id: number) => void;
  setViewState: (view: string) => void;
  setDetailTab: (tab: string) => void;
}

export const ProfileSidebar = ({
  followingCount,
  followersCount,
  tracksCount,
  displayUsers,
  links,
  favoriteGenres,
  toggleFollow,
  setViewState,
  setDetailTab,
}: ProfileSidebarProps) => {
  const { likedTracks } = useLikeStore();

  return (
    <div className="w-full lg:w-[320px] flex flex-col text-left">
      {/* --- SECTION 1: TOP STATISTICS --- */}
      <div className="mb-10">
        <Stats
          followers={followersCount}
          following={followingCount}
          tracks={tracksCount}
        />
      </div>

      {/* --- SECTION 2: ON TOUR / ARTIST PRO --- */}
      <div className="bg-zinc-900/20 p-5 rounded-md border border-zinc-800/50 mb-10 text-left">
        <p className="text-white font-bold mb-3 flex items-center gap-2 text-[12px] tracking-widest uppercase">
          <span className="text-[#f50]">🎫</span> ON TOUR{" "}
          <span className="text-zinc-500 text-xs">ⓘ</span>
        </p>
        <div className="h-[1px] bg-zinc-800 w-full mb-4" />
        <p className="text-zinc-400 text-[13px] mb-6 leading-snug">
          With an Artist Pro account, you can create ticketed live events on
          SoundCloud, and list existing events.
        </p>
        <button className="w-full bg-white text-black py-2 rounded-full font-bold hover:bg-zinc-200 transition-all text-sm uppercase">
          Upgrade to Artist Pro
        </button>
      </div>

      {/* --- SECTION 3: LIKED TRACKS --- */}
      <div className="space-y-5 border-t border-zinc-900 pt-6 mb-10">
        <div className="flex justify-between items-center text-zinc-500 text-[13px]">
          <p className="font-bold uppercase tracking-tight flex items-center gap-2">
            <Heart size={14} /> {likedTracks.length} Likes
          </p>
          <button
            onClick={() => {
              setViewState("details");
              setDetailTab("Likes");
            }}
            className="hover:text-white transition-colors font-bold text-xs uppercase"
          >
            View all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {likedTracks.length === 0 ? (
            <p className="text-zinc-600 text-xs italic py-2">No tracks liked yet.</p>
          ) : (
            likedTracks.slice(-3).reverse().map((likedTrack) => (
              <div key={likedTrack.id} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-zinc-800 rounded flex-shrink-0 group-hover:bg-zinc-700 transition-colors border border-zinc-800/50 flex items-center justify-center">
                  <Heart size={10} className="text-zinc-600 group-hover:text-[#f50]" />
                </div>
                <div className="min-w-0 flex-grow text-left">
                  <p className="text-zinc-200 text-[13px] truncate font-medium group-hover:text-[#f50] transition-colors">
                    {likedTrack.title}
                  </p>
                  <p className="text-zinc-500 text-[11px] uppercase tracking-tighter">
                    Artist Name
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- SECTION 4: FOLLOWING LIST --- */}
      <div className="space-y-5 border-t border-zinc-900 pt-6">
        <div className="flex justify-between items-center text-zinc-500 text-[13px]">
          <p className="font-bold uppercase tracking-tight">
            👤 {followingCount} Following
          </p>
          <button
            onClick={() => {
              setViewState("details");
              setDetailTab("Following");
            }}
            className="hover:text-white transition-colors font-bold text-xs uppercase"
          >
            View all
          </button>
        </div>

        <div className="space-y-4">
          {displayUsers.slice(0, 3).map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden relative border border-zinc-800">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-[13px]">
                    {user.name} <span className="text-[#38bdf8] text-[10px]">✓</span>
                  </p>
                  <p className="text-zinc-500 text-[11px] flex items-center gap-1">
                    👤 {user.followers} <span className="opacity-50">|||</span> 164
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleFollow(user.id)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded text-[11px] font-bold uppercase transition-all hover:border-white"
              >
                Following
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 5: SOCIAL LINKS --- */}
      <div className="pt-6 border-t border-zinc-900 mt-10">
        <p className="text-zinc-500 text-[11px] font-bold uppercase mb-4 text-left tracking-widest">
          Social Links
        </p>
        <SocialLinksList links={links} />
        {(!links || links.length === 0) && (
          <p className="text-zinc-600 text-[11px] italic">No social links added</p>
        )}
      </div>

      {/* --- SECTION 6: FAVORITE GENRES --- */}
      <div className="pt-6 border-t border-zinc-900 mt-10 text-left">
        <p className="text-zinc-500 text-[11px] font-bold uppercase mb-3 tracking-widest">
          Favorite Genre
        </p>
        <div className="flex flex-wrap gap-2">
          {favoriteGenres && favoriteGenres.length > 0 ? (
            favoriteGenres.map((genre: string) => (
              <p key={genre} className="text-white font-bold text-[14px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {genre}
              </p>
            ))
          ) : (
            <p className="text-zinc-600 text-[11px] italic">No genres selected</p>
          )}
        </div>
      </div>
    </div>
  );
};