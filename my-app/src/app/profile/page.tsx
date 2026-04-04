"use client";
import React from "react";
import { FiShare } from "react-icons/fi";
import { GrEdit } from "react-icons/gr";
import { useProfileController } from "../../hooks/useProfileController";
import Image from "next/image";
import { useParams } from "next/navigation"; 
import { EditProfileModal } from "../../components/profile/modals/EditProfileModal";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ShareModal } from "@/src/components/profile/modals/ShareModal";
import { ProfileSidebar } from "@/src/components/profile/ProfileSidebar";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto } from "@/src/components/profile/CoverPhoto";
interface User {
  id: number;
  name: string;
  handle: string;
  followers: string;
  tracks: number;
  isFollowing: boolean;
  avatar: string;
}
import { useProfileController } from "@/src/hooks/useProfileController";
import { Stats } from "@/src/components/profile/sidebar/Stats";
import { SocialLinksList } from "@/src/components/profile/sidebar/SocialLinksList";
import { EditProfileModal } from "@/src/components/profile/modals/EditProfileModal";
import { UserCard } from "@/src/components/user/UserCard";
// SPRINT 2: Stores for real-time syncing
import { useFollowStore } from "@/src/store/followStore";

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.handle as string || params.id as string; 

  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";


  const controller = useProfileController(profileId); // parameter

  // SPRINT 2: Follow Logic identifiers
  const following = useFollowStore((state) => state.following || []); 
  const realFollowingCount = following.length;

  // SPRINT 2: Like Logic identifiers
  const {
    displayName,
    bio,
    location,
    website,
    activeTab,
    setActiveTab,
    tabs,
    viewState,
    setViewState,
    detailTab,
    setDetailTab,
    isShareOpen,
    setIsShareOpen,
    accountType,
    isEditOpen,
    setIsEditOpen,
    handleAvatarUpload,
    avatarUrl,
    followersCount,
    followingCount,
    tracksCount,
    showSuccessToast,
    links,
    displayTracks,
    displayUsers,
    toggleFollow,
    likesList,
    searchQuery,    
    setSearchQuery, 
    filteredUsers,  
    suggestedUsers,
    handleLoadMore, // Added from controller
    isLoading,      // Added from controller
  } = controller;

  /**
   * Sub-render function for the Details View (Likes, Following, Followers)
   */
  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      {/* 1. Detail View Header (Avatar and Title) */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-500 shadow-xl"></div>
        <h2 className="text-3xl font-bold uppercase">
          {detailTab} BY {displayName}
        </h2>
      </div>

      {/* 2. Internal Navigation Tabs within Details */}
      <div className="border-b border-zinc-800 mb-8">
        <ul className="flex gap-8 text-sm font-bold text-zinc-400">
          {["Likes", "Following", "Followers"].map((t) => (
            <li
              key={t}
              onClick={() => setDetailTab(t)}

              className={`pb-2 cursor-pointer border-b-2 transition-all uppercase ${
                detailTab === t ? "text-white border-white" : "border-transparent hover:text-zinc-200"
              }`}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="py-10 space-y-8">
        
        {/* --- 3. SEARCH INPUT FIELD --- */}
        {(detailTab === "Following" || detailTab === "Followers") && (
          <div className="relative max-w-md mb-8">
            <input
              type="text"
              placeholder={`Search ${detailTab.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-orange-500 transition-all text-sm"
            />
            <span className="absolute right-3 top-2.5 opacity-40">🔍</span>
          </div>
        )}

        {/* --- 4. LIKES TAB RENDERING (Module 3: Social Graph Clean Version) --- */}
        {detailTab === "Likes" && (
          <div className="py-24 text-center flex flex-col items-center justify-center border border-zinc-900/50 rounded-lg bg-zinc-900/10 w-full animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-zinc-800/40 rounded-full flex items-center justify-center mb-8 border border-zinc-800 shadow-inner">
               <span className="text-4xl opacity-80">🧡</span>
            </div>
          
            <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-[0.2em]">
              No Liked Tracks Yet
            </h3>
            
            <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed mb-10 px-6">
              You havenot liked any tracks yet. Start following artists and exploring their profiles to build your favorite music collection.
            </p>
            
            <button 
              onClick={() => { setViewState("profile"); setDetailTab("Following"); }} 
              className="bg-white text-black px-10 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest shadow-2xl active:scale-95"
            >
              Explore Artists
            </button>
          </div>
        )};
        {/* --- 5. FOLLOWING/FOLLOWERS GRID (Using Filtered Results) --- */}
        {(detailTab === "Following" || detailTab === "Followers") && (
          filteredUsers && filteredUsers.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {filteredUsers.map((user: User) =>
                 (
                  <div key={`${detailTab}-${user.id}`} className="flex flex-col items-center text-center group">
                    <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all duration-300 shadow-2xl bg-zinc-900">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          fill={true}
                          className="w-full h-full object-cover"
                          priority={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800" />
                      )}
                    </div>

                    <h4 className="font-bold text-white text-sm flex items-center gap-1 mb-1 truncate w-full justify-center uppercase tracking-wider">
                      {user.name} <span className="text-[#38bdf8] text-[10px]">✓</span>
                    </h4>
                    <p className="text-zinc-500 text-[11px] mb-4">
                      {user.followers} followers
                    </p>

                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                        user.isFollowing
                          ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Button Section */}
              <div className="flex justify-center mt-12 mb-4">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors border border-zinc-700 font-bold uppercase text-xs tracking-widest"
                >
                  {isLoading ? "Loading..." : "Load More Users"}
                </button>
              </div>
            </>
          ) : (
            /* Empty Search Results / Empty State */
            <div className="py-20 text-center flex flex-col items-center">
              <p className="text-xl font-bold text-zinc-600 uppercase tracking-widest mb-12">
                {searchQuery 
                  ? `No results found for "${searchQuery}"` 
                  : `You have no ${detailTab.toLowerCase()} yet.`}
              </p>
              <button
                onClick={() => { setViewState("profile"); setSearchQuery(""); }}
                className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-sm"
              >
                ← Back to Profile
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );

  
return (
  <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden relative">
    
    {/* --- 1. CONDITIONAL RENDERING: DETAILS VS MAIN PROFILE --- */}
    {viewState === "details" ? (
      renderDetailsPage()
    ) : (
      <>
        {/* --- SECTION 1: VISUAL HEADER (Banner & Avatar) --- */}
        <div className="relative w-full min-h-[260px] bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
            <CoverPhoto />
            <AvatarUpload 
              username={displayName} 
              location={location} 
              onUpload={handleAvatarUpload} 
              avatarUrl={avatarUrl}
            />
          </div>
        </div>

        {/* --- SECTION 2: NAVIGATION BAR (Sticky Tabs) --- */}
        <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40 overflow-x-auto">
          <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12 min-w-[600px] md:min-w-full">
            <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
              {tabs?.map((tab: string) => (
                <li
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer outline-none transition-colors h-full flex items-center border-b-2 ${
                    activeTab === tab 
                      ? "text-white border-white" 
                      : "border-transparent hover:text-white"
                  }`}
                >
                  {tab}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => setIsShareOpen(true)} className={BUTTON_STYLE}>
                <FiShare size={15} /> Share
              </button>
              <button onClick={() => setIsEditOpen(true)} className={BUTTON_STYLE}>
                <GrEdit size={15} /> Edit
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: MAIN LAYOUT (Gehad: Module 3 Focus) --- */}
        <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
          
          {/* Main Feed Area: Handles non-social tabs as Empty States */}
          <div className="flex-1 border-r border-zinc-900/50 pr-12 text-left">
            {activeTab && (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                  <span className="text-3xl">
                    {activeTab === "Playlists" ? "📁" : activeTab === "Albums" ? "💿" : "🎵"}
                  </span>
                </div>
                <p className="text-zinc-500 text-xl font-bold mb-2 uppercase tracking-widest">
                  Nothing to show here yet
                </p>
                <p className="text-zinc-600 text-sm mb-8">
                  {`It seems there are no ${activeTab.toLowerCase()} to display at the moment.`}
                </p>
                <button 
                  onClick={() => setViewState("profile")}
                  className="bg-white text-black px-8 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase text-xs tracking-tighter"
                >
                  Explore Tracks
                </button>
              </div>
            )}
          </div>

          {/* Profile Sidebar: Essential for real-time Following/Followers counters */}
          <ProfileSidebar 
            followingCount={followingCount}
            followersCount={followersCount}
            tracksCount={tracksCount}
            displayUsers={displayUsers}
            links={links}
            toggleFollow={toggleFollow}
            setViewState={setViewState}
            setDetailTab={setDetailTab}
            favoriteGenres={controller.favoriteGenres}
            suggestedUsers={suggestedUsers}
          />
        </div>
      </>
    )}

    {/* --- SECTION 4: MODALS & NOTIFICATIONS --- */}

    {/* Edit Profile Modal */}
    <EditProfileModal
      isOpen={isEditOpen}
      onClose={() => setIsEditOpen(false)}
      data={{
        displayName,
        handle: controller.handle,
        bio,
        location,
        website,
        accountType,
        favoriteGenres: controller.favoriteGenres,
        genres: controller.genres.flat(),
        links: controller.links,
        isPrivate: controller.isPrivate,
        error: controller.error,
        isSaving: controller.isSaving,
      }}
      handlers={controller}
    />

    {/* Share Modal */}
    <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} {...controller} />

    {/* Success Notification Toast */}
    {showSuccessToast && (
      <div className="fixed top-20 right-10 z-[100] animate-in slide-in-from-right duration-300">
        <div className="bg-[#333] border border-zinc-700 p-4 flex items-center gap-4 shadow-2xl rounded-sm min-w-[300px]">
          <div className="w-12 h-12 bg-zinc-600 flex items-center justify-center rounded-sm">
            <span className="text-zinc-400 text-2xl">👤</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold">Your profile has been updated successfully.</p>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
