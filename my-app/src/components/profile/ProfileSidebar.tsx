import React from "react";
import Image from "next/image";
import { Stats } from "./sidebar/Stats";
import { SocialLinksList } from "./sidebar/SocialLinksList";

/**
 * Define User data structure for the sidebar to prevent 'any' usage
 */
interface SidebarUser {
  id: number;
  name: string;
  followers: string;
  avatar: string;
}

/**
 * Define Social Links structure for the sidebar
 */
interface SidebarSocialLink {
  id: number;
  platform: string;
  url: string;
}

// 1. أضيفي هذا النوع الجديد للاقتراحات
interface SuggestedUser {
  id: number;
  name: string;
  reason: string;      // هذا هو الحقل المطلوب للاقتراحات
  isFollowing: boolean;
  avatar: string;
}

interface ProfileSidebarProps {
  followingCount: number;
  followersCount: number;
  tracksCount: number;
  displayUsers: SidebarUser[];
  links: SidebarSocialLink[];
  favoriteGenres?: string[];
  suggestedUsers: SuggestedUser[]; 
  toggleFollow: (id: number) => void;
  setViewState: (view: string) => void;
  setDetailTab: (tab: string) => void;
}


/**
 * Sidebar component properties
 */
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

      {/* --- SECTION 2: LIKES PREVIEW --- */}
      <div className="mb-10 border-t border-zinc-900 pt-4">
        <div className="flex justify-between items-center text-zinc-500 text-[13px] mb-4">
          <p className="font-bold uppercase tracking-tight">🧡 1 LIKE</p>
          <button className="hover:text-white transition-colors text-xs">
            View all
          </button>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-12 h-12 relative flex-shrink-0">
            <Image
              src="https://i1.sndcdn.com/artworks-Xy7D9X3W-t500x500.jpg"
              alt="Liked track"
              fill
              className="object-cover rounded-sm"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-zinc-500 text-[11px] truncate">Bad Bunny, NFL</p>
            <p className="text-white text-[13px] font-bold leading-tight mb-1 truncate">
              Super Bowl LX Halftime Show (Live)
            </p>
            <div className="flex gap-2 text-zinc-500 text-[10px] font-bold">
              <span>▶ 173K</span> <span>🧡 7,041</span> <span>🔁 301</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 3: ON TOUR / ARTIST PRO --- */}
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
                    {user.name}{" "}
                    <span className="text-[#38bdf8] text-[10px]">✓</span>
                  </p>
                  <p className="text-zinc-500 text-[11px] flex items-center gap-1">
                    👤 {user.followers} <span className="opacity-50">|||</span>{" "}
                    164
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

      {/* --- SECTION: WHO TO FOLLOW (Suggestions) --- */}
      {/* Added logic for suggested users */}
      <div className="space-y-4 border-t border-zinc-900 pt-6 mt-10">
        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest text-left flex items-center gap-2">
          💡 Suggested for you
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-purple-600 opacity-50"></div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-xs">Mazen LoFi</p>
                <p className="text-zinc-500 text-[10px]">Shared genres</p>
              </div>
            </div>
            <button
              onClick={() => toggleFollow(301)} 
              className="text-[10px] font-bold uppercase text-white border border-zinc-700 px-2 py-1 rounded hover:border-white transition-colors"
            >
              Follow
            </button>{" "}
          </div>
        </div>
      </div>

      {/* --- SECTION 5: SOCIAL LINKS --- */}
      <div className="pt-6 border-t border-zinc-900 mt-10">
        <p className="text-zinc-500 text-[11px] font-bold uppercase mb-4 text-left tracking-widest">
          Social Links
        </p>
        <SocialLinksList links={links} />
        {(!links || links.length === 0) && (
          <p className="text-zinc-600 text-[11px] italic">
            No social links added
          </p>
        )}
      </div>

      {/* --- FAVORITE GENRES SECTION --- */}
      {/* Added Genre listing based on user selection */}
      <div className="pt-6 border-t border-zinc-900 mt-10 text-left">
        <p className="text-zinc-500 text-[11px] font-bold uppercase mb-3 tracking-widest">
          Favorite Genre
        </p>
        <div className="flex flex-wrap gap-2">
          {favoriteGenres && favoriteGenres.length > 0 ? (
            favoriteGenres.map((genre: string) => (
              <p
                key={genre}
                className="text-white font-bold text-[14px] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {genre}
              </p>
            ))
          ) : (
            <p className="text-zinc-600 text-[11px] italic">
              No genres selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
