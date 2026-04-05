"use client";

import React, { useEffect } from "react";
import { FiShare } from "react-icons/fi";
import { GrEdit } from "react-icons/gr";
import { useProfileController } from "../../hooks/useProfileController";
import { useParams } from "next/navigation";
import NavBar from "@/src/components/ui/NavBar";
import { EditProfileModal } from "../../components/profile/modals/EditProfileModal";
import { ShareModal } from "@/src/components/profile/modals/ShareModal";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto } from "@/src/components/profile/CoverPhoto";
import { ProfileSidebar } from "@/src/components/profile/ProfileSidebar";
import { useFollowStore } from "@/src/store/followStore";
import { useLikeStore } from "@/src/store/likeStore";
import { UserCard } from "@/src/components/profile/UserCard";

export default function ProfilePage() {
  const params = useParams();
  const profileId = (params.handle as string) || (params.id as string);

  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";

  const controller = useProfileController(profileId);

  // Zustand Store
  const following = useFollowStore((state) => state.following || []);
  const likedTracks = useLikeStore((state) => state.likedTracks || []);
  const storeToggleFollow = useFollowStore((state) => state.toggleFollow);
  const checkIsFollowing = useFollowStore((state) => state.isFollowing);
  const fetchFollowing = useFollowStore((state) => state.fetchFollowing);

  // Fetch following data on load
  useEffect(() => {
    if (profileId) {
      fetchFollowing(profileId.toString());
    }
  }, [profileId, fetchFollowing]);

  const {
    displayName,
    location,
    favoriteGenres,
    activeTab,
    setActiveTab,
    tabs,
    viewState,
    setViewState,
    detailTab,
    setDetailTab,
    isShareOpen,
    setIsShareOpen,
    isEditOpen,
    setIsEditOpen,
    handleAvatarUpload,
    avatarUrl,
    links,
    searchQuery,
    setSearchQuery,
    displayUsers,
  } = controller;

  // Logic to determine which list to show in Details view
  const sourceUsers = detailTab === "Following" ? following : displayUsers;

  const filteredUsers =
    sourceUsers?.filter((user: any) => {
      const name = user.displayName || user.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold uppercase">{displayName.charAt(0)}</span>
          )}
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
              onClick={() => {
                setDetailTab(t);
                setSearchQuery("");
              }}
              className={`pb-2 cursor-pointer border-b-2 transition-all ${
                detailTab === t ? "text-white border-white" : "border-transparent hover:text-zinc-200"
              }`}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      {(detailTab === "Following" || detailTab === "Followers") && (
        <div className="relative max-w-md mb-8">
          <input
            type="text"
            placeholder={`Search ${detailTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white transition-all text-sm"
          />
        </div>
      )}

      <div className="py-10 text-center flex flex-col items-center">
        {detailTab === "Likes" &&
          (likedTracks.length === 0 ? (
            <p className="text-2xl font-bold text-zinc-500 uppercase py-24">NO LIKES YET.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
              {likedTracks.map((track: any) => (
                <div key={track.id} className="text-left group cursor-pointer">
                  <div className="aspect-square bg-zinc-800 border border-zinc-700 mb-2" />
                  <p className="font-bold text-xs uppercase truncate">{track.title}</p>
                </div>
              ))}
            </div>
          ))}

        {(detailTab === "Following" || detailTab === "Followers") &&
          (filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 w-full max-w-6xl">
              {filteredUsers.map((user: any) => (
                <UserCard
                  key={user.id}
                  user={{
                    ...user,
                    name: user.displayName || user.name,
                    isFollowing: checkIsFollowing(user.id),
                    followers: user.followersCount || user.followers || 0
                  }}
                  type="follow"
                  onAction={() => storeToggleFollow(user)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xl font-bold text-zinc-600 uppercase py-20">Nothing found.</p>
          ))}

        <button
          onClick={() => setViewState("profile")}
          className="mt-12 bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-sm"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden relative">
      <NavBar className="max-w-7xl mx-auto px-6" />
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-6">
        {viewState === "details" ? (
          renderDetailsPage()
        ) : (
          <>
            <div className="relative w-full min-h-65 bg-[#d38b7d] p-6 flex flex-col md:flex-row items-center justify-start gap-6">
              <CoverPhoto />
              <div className="flex flex-col md:flex-row items-center gap-6 z-10">
                <AvatarUpload
                  username={displayName}
                  location={location}
                  onUpload={handleAvatarUpload}
                  avatarUrl={avatarUrl}
                />
                <div className="bg-black px-4 py-2 border border-zinc-800/50">
                  <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tight text-white">
                    {displayName}
                  </h1>
                </div>
              </div>
            </div>

            {/* Sticky Tabs */}
            <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40">
              <div className="container mx-auto px-8 flex justify-between items-center h-12">
                <ul className="flex gap-8 text-[14px] font-bold text-zinc-400">
                  {tabs?.map((tab: string) => (
                    <li
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer h-12 flex items-center border-b-2 ${
                        activeTab === tab ? "text-white border-white" : "border-transparent"
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

            {/* Main Content */}
            <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12">
              <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12">
                <p className="text-zinc-500 text-xl font-bold uppercase">Seems a little quiet over here</p>
              </div>

              <div className="relative z-30">
                <ProfileSidebar
                  followersCount={controller.followersCount || 0}
                  followingCount={following.length}
                  tracksCount={controller.tracksCount || 0}
                  toggleFollow={(sidebarUser: any) => {
                    const fullUser = following.find((u) => u.id?.toString() === sidebarUser.id?.toString());
                    storeToggleFollow(fullUser || sidebarUser);
                  }}
                  displayUsers={following
                    .filter((u) => u && u.id)
                    .map((u: any) => ({
                      id: u.id,
                      name: u.displayName || u.name || "Unknown",
                      avatar: u.avatarUrl || u.avatar || "/Blossom.png",
                      isFollowing: true,
                      followers: u.followersCount?.toString() || "0",
                      tracks: u.tracksCount?.toString() || "0",
                    }))}
                  links={links || []}
                  favoriteGenres={favoriteGenres}
                  setViewState={setViewState}
                  setDetailTab={setDetailTab}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        data={{ ...controller, favoriteGenres }}
        handlers={controller}
      />
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} {...controller} />
    </div>
  );
}