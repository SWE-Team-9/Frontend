"use client";
import React from "react";
import Image from "next/image";
import { Stats } from "./sidebar/Stats";
import { SocialLinksList } from "./sidebar/SocialLinksList";

/**
 * Define User data structure for the sidebar to prevent 'any' usage
 */
interface SidebarUser {
  id: string | number;
  name: string;
  followers: string;
  avatar: string;
  isFollowing?: boolean;
  tracks: string;
}

/**
 * Define Social Links structure for the sidebar
 */
interface SidebarSocialLink {
  id: number;
  platform: string;
  url: string;
}


/**
 * Sidebar component properties
 */

interface ProfileSidebarProps {
  followersCount: number;
  followingCount: number;
  tracksCount: number;
  displayUsers: SidebarUser[];
  toggleFollow: (user: SidebarUser) => void;
  links: any[];
  favoriteGenres: string[];
  setViewState: (view: "profile" | "details") => void;
  setDetailTab: (tab: string) => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  followersCount,
  followingCount,
  tracksCount,
  displayUsers,
  toggleFollow,
  links,
  favoriteGenres,
  setViewState,
  setDetailTab,
}) => {
  
  const handleDetailClick = (tab: string) => {
    setDetailTab(tab);
    setViewState("details");
  };
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
      {/* <div className="mb-10 border-t border-zinc-900 pt-4">
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
      </div> */}

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
      {/* Following List (The part you are having trouble with) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            Following
          </h3>
          <button 
            onClick={() => handleDetailClick("Following")}
            className=" text-zinc-500 text-[10px] hover:text-white uppercase"
          >
            View all
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {displayUsers.length > 0 ? (
            displayUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden relative border border-zinc-800">
                    <Image
                      src={user.avatar || "/Blossom.png"}
                      alt={user.name || "User avatar"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase">
                      {user.followers} followers
                    </p>
                  </div>
                </div>
                
                {/* CRITICAL: Ensure toggleFollow(user) passes the WHOLE user object */}
                <button
                  onClick={() => toggleFollow(user)}
                  className="bg-white text-black  group-hover:opacity-100  border border-zinc-700 px-3 py-1 rounded text-[9px] font-bold uppercase hover:bg-zinc-400 transition-all"
                >
                  {user.isFollowing ? "following" : "Follow"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-zinc-600 uppercase italic">Not following anyone yet</p>
          )}
        </div>
      </div>


      {/* --- SECTION 5: SOCIAL LINKS --- */}
      <div className="pt-6 border-t border-zinc-900 mt-10">

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
