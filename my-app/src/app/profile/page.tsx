"use client";

import React, { useState, useEffect } from "react";
import { FiShare } from "react-icons/fi";
import { GrEdit } from "react-icons/gr";
import Image from "next/image";
import { useParams } from "next/navigation";

// Internal Components
import { useProfileController } from "../../hooks/useProfileController";
import { EditProfileModal } from "../../components/profile/modals/EditProfileModal";
import { ShareModal } from "../../components/profile/modals/ShareModal";
import { ProfileSidebar } from "../../components/profile/ProfileSidebar";
import { AvatarUpload } from "../../components/profile/AvatarUpload";
import { CoverPhoto } from "../../components/profile/CoverPhoto";
import  TrackList  from "../../components/tracks/TrackList";
import { Track } from "../../types/track";
import { useLikeStore } from "@/src/store/likeStore";

// Types

interface User {
  id: number;
  name: string;
  handle: string;
  followers: string;
  tracks: number;
  isFollowing: boolean;
  avatar: string;
}

export default function ProfilePage() {
  const params = useParams();
  const profileId = (params.handle as string) || (params.id as string);
  const controller = useProfileController(profileId);

  const [tracks, setTracks] = useState<Track[]>([]);
  const { likedTracks } = useLikeStore();

  // Mock Data for Tracks
  useEffect(() => {
    const manualMock: Track[] = [
      {
        trackId: "trk_001",
        title: "Recording 2026-03-15 1013",
        status: "FINISHED",
        visibility: "PUBLIC",
      },
      {
        trackId: "trk_002",
        title: "Second Track Demo",
        status: "PROCESSING",
        visibility: "PRIVATE",
      },
    ];
    setTracks(manualMock);
  }, []);

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
    showSuccessToast,
    links,
    displayUsers,
    toggleFollow,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    handleLoadMore,
    isLoading,
    activeId
  } = controller;

  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";

  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-500 shadow-xl overflow-hidden">
           {avatarUrl && <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />}
        </div>
        <h2 className="text-3xl font-bold uppercase">
          {detailTab} BY {displayName}
        </h2>
      </div>

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
        {(detailTab === "Following" || detailTab === "Followers") && (
          <div className="relative max-w-md mb-8">
            <input
              type="text"
              placeholder={`Search ${detailTab.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-orange-500 transition-all text-sm"
            />
          </div>
        )}

        {detailTab === "Likes" && (
  <div className="w-full">
    {likedTracks.length > 0 ? (
      /* 1. THE ACTUAL LIST */
      <div className="grid grid-cols-1 gap-4">
        {likedTracks.map((track) => (
          <div 
            key={track.id} 
            className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded shadow-md" />
              <div>
                <h4 className="text-white font-bold">{track.title}</h4>
                <p className="text-zinc-500 text-sm">Artist Name</p>
              </div>
            </div>
            {/* Optional: Add a remove button or play button here */}
          </div>
        ))}
      </div>
    ) : (
      /* 2. THE EMPTY STATE (Your existing code) */
      <div className="py-24 text-center flex flex-col items-center justify-center border border-zinc-900/50 rounded-lg bg-zinc-900/10 w-full">
        <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-[0.2em]">
          No Liked Tracks Yet
        </h3>
        <button
          onClick={() => setViewState("profile")}
          className="bg-white text-black px-10 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest"
        >
          Explore Artists
        </button>
      </div>
    )}
  </div>
)}

        {(detailTab === "Following" || detailTab === "Followers") && (
          filteredUsers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {filteredUsers.map((user: User) => (
                <div key={`${detailTab}-${user.id}`} className="flex flex-col items-center text-center group">
                  <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all shadow-2xl bg-zinc-900">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm uppercase mb-1">{user.name}</h4>
                  <p className="text-zinc-500 text-[11px] mb-4">{user.followers} followers</p>
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                      user.isFollowing ? "bg-zinc-800 text-zinc-400 border border-zinc-700" : "bg-white text-black hover:bg-zinc-200"
                    }`}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-xl font-bold text-zinc-600 uppercase mb-8">Nothing found.</p>
              <button onClick={() => setViewState("profile")} className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-sm">
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
      {viewState === "details" ? (
        renderDetailsPage()
      ) : (
        <>
          <div className="relative w-full min-h-[260px] bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
              <CoverPhoto />
              <AvatarUpload username={displayName} location={location} onUpload={handleAvatarUpload} avatarUrl={avatarUrl} />
            </div>
          </div>

          <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12">
              <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
                {tabs?.map((tab: string) => (
                  <li
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer h-full flex items-center border-b-2 transition-colors ${
                      activeTab === tab ? "text-white border-white" : "border-transparent hover:text-white"
                    }`}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => setIsShareOpen(true)} className={BUTTON_STYLE}><FiShare size={15} /> Share</button>
                <button onClick={() => setIsEditOpen(true)} className={BUTTON_STYLE}><GrEdit size={15} /> Edit</button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
            <div className="flex-1 border-r border-zinc-900/50 pr-12">
              {activeTab === "Tracks" || activeTab === "All" ? (
                <TrackList userId={activeId} type="tracks" />
              ) : (
                <div className="py-20 text-center">
                  <p className="text-zinc-500 text-xl font-bold uppercase tracking-widest">Nothing to show here yet</p>
                </div>
              )}
            </div>

            <ProfileSidebar
              followersCount={controller.followersCount}
              followingCount={displayUsers.filter((u) => u.isFollowing).length}
              tracksCount={tracks.length}
              // Map displayUsers to satisfy the SidebarUser interface
              displayUsers={displayUsers.map(u => ({
                id: u.id,
                name: u.name,
                avatar: u.avatar || "/Blossom.png",
                isFollowing: u.isFollowing,
                followers: u.followers?.toString() || "0",
                tracks: u.tracks || 0
              }))}
              links={links}
              toggleFollow={toggleFollow}
              setViewState={setViewState}
              setDetailTab={setDetailTab}
              favoriteGenres={controller.favoriteGenres}
            />
          </div>
        </>
      )}

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

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} {...controller} />

      {showSuccessToast && (
        <div className="fixed top-20 right-10 z-[100] bg-[#333] border border-zinc-700 p-4 rounded-sm shadow-2xl animate-in slide-in-from-right">
          <p className="text-white text-sm font-bold">Your profile has been updated successfully.</p>
        </div>
      )}
    </div>
  );
}