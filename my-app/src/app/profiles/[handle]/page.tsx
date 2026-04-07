"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/src/components/ui/NavBar";
import { FiShare } from "react-icons/fi";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto } from "@/src/components/profile/CoverPhoto";
import { GrEdit } from "react-icons/gr";
import { useProfileController } from "@/src/hooks/useProfileController";
import { Stats } from "@/src/components/profile/sidebar/Stats";
import { SocialLinksList } from "@/src/components/profile/sidebar/SocialLinksList";
import { EditProfileModal } from "@/src/components/profile/modals/EditProfileModal";
import { ShareModal } from "@/src/components/profile/modals/ShareModal";
import FollowButton from "@/src/components/profile/sidebar/FollowButton";
import Image from "next/image";
import { useFollowStore } from "@/src/store/followStore";
import { useLikeStore } from "@/src/store/likeStore";
import api from "@/src/services/api";
import TrackList from "@/src/components/tracks/TrackList";
import { TrackCard } from "@/src/components/tracks/TrackCard";

interface User {
  id: number;
  name: string;
  handle: string;
  followers: string;
  tracks: number;
  isFollowing: boolean;
  avatar: string;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = React.use(params);
  const handle = resolvedParams.handle;

  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(null);
  const controller = useProfileController(handle);

  const isOwner = currentUserHandle === handle;

  const following = useFollowStore((state) => state.following || []);
 
  const followers = useFollowStore((state) => state.followers || []);
  const fetchFollowing = useFollowStore((state) => state.fetchFollowing);

  const fetchFollowers = useFollowStore((state) => state.fetchFollowers);
  const storeToggleFollow = useFollowStore((state) => state.toggleFollow);
  const checkIsFollowing = useFollowStore((state) => state.isFollowing);
  const followError = useFollowStore((state) => state.error);

  const likedTracks = useLikeStore((state) => state.likedTracks || []);
  const likeError = useLikeStore((state) => state.error);


  // Fetch follow/follower lists when page loads
  useEffect(() => {
    if (controller.userId) {
      fetchFollowing(controller.userId);
      fetchFollowers(controller.userId); //Menna
    }
  }, [controller.userId, fetchFollowing, fetchFollowers]); //Menna

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setCurrentUserHandle(data.handle);
      } catch {
        setCurrentUserHandle(null);
      }
    };
    fetchCurrentUser();
  }, []);

  const router = useRouter();
  const BUTTON_STYLE = "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";

  const {
    displayName,
    location,
    links,
    activeTab,
    setActiveTab,
    tabs,
    viewState,
    setViewState,
    detailTab,
    setDetailTab,
    setIsShareOpen,
    avatarUrl,
    accountType,
    setIsEditOpen,
    handleAvatarUpload,
    showSuccessToast,
    isShareOpen,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    toggleFollow,
  } = controller;

  // ─── DETAILS VIEW ────────────────────────
  const renderDetailsPage = () => {
    let usersToShow: User[] = [];

    if (detailTab === "Following") {
      usersToShow = following.map((u: any) => ({
        id: u.id,
        name: u.display_name || u.name || "Unknown User",
        handle: u.handle || "",
        followers: u.followers_count?.toString() || "0",
        tracks: u.tracks_count || 0,
        isFollowing: true,
        avatar: u.avatar_url || u.avatar || "/images/profile.png"
      }));
    } else if (detailTab === "Followers") {
      usersToShow = (filteredUsers || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.display_name,
        handle: u.handle,
        followers: u.followers || "0",
        tracks: u.tracks || 0,
        isFollowing: u.isFollowing || false,
        avatar: u.avatar || "/images/profile.png"
      }));
    }

//   // Following/Followers tabs use dedicated store lists
//   const sourceUsers = detailTab === "Following" ? following : followers;

    const results = usersToShow.filter(user =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-32 h-32 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 relative">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <span className="text-4xl font-bold uppercase text-zinc-400">{displayName?.charAt(0)}</span>
            )}
          </div>
          <h2 className="text-3xl font-bold uppercase">{detailTab} BY {displayName}</h2>
        </div>

        <div className="border-b border-zinc-800 mb-8">
          <ul className="flex gap-8 text-sm font-bold text-zinc-400">
            {["Likes", "Following", "Followers"].map((t) => (
              <li
                key={t}
                onClick={() => { setDetailTab(t); setSearchQuery(""); }}
                className={`pb-2 cursor-pointer border-b-2 transition-all ${detailTab === t ? "text-white border-white" : "border-transparent hover:text-zinc-200"}`}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="py-10">
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

          {detailTab === "Likes" ? (
            likedTracks.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-2xl font-bold text-zinc-500 uppercase">No likes yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {likedTracks.map((track: any) => (
                  <TrackCard key={track.trackId || track.id} track={track} isOwner={false} />
                ))}
              </div>
            )
          ) : (
            results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {results.map((user: User) => (
                  <div key={`${detailTab}-${user.id}`} className="flex flex-col items-center text-center group">
                    <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all shadow-2xl bg-zinc-900">
                      <Image src={user.avatar || "/images/profile.png"} alt={`${ user.name || 'User'}'s profile picture`} fill className="object-cover" />
                    </div>
                    <h4 className="font-bold text-white text-sm uppercase mb-1">{user.name}</h4>
                    <p className="text-zinc-500 text-[11px] mb-4">{user.followers} followers</p>
                    <FollowButton 
                      user={{
                        id: user.id.toString(),
                        display_name: user.name,
                        handle: user.handle,
                      avatar_url: user.avatar
                      }} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-xl font-bold text-zinc-600 uppercase mb-8">Nothing found.</p>
              </div>
            )
          )}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => setViewState("profile")}
            className="bg-zinc-800 text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-700 transition-all uppercase text-xs"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    );
  };

  // ─── MAIN FEED ───────────────────────────────────────
  const renderFeedContent = () => {
    if (activeTab === "Tracks"|| activeTab === "All") {
      return (
        <div className="flex-1 border-r border-zinc-900/50 pr-12">

<!--           <TrackList userId={controller.userId }type="tracks" /> -->

          {controller.userId ? (
            <TrackList userId={controller.userId} />
          ) : (
            <p className="text-sm text-zinc-500">Loading tracks...</p>
          )}
        </div>
      );
    }

    if (activeTab === "Playlists") {
      return (
        <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
          <p className="text-zinc-500 text-xl font-bold">
            You haven&apos;t created any playlists.
          </p>
        </div>
      );
    }
    if (activeTab === "Reposts") {
    return (
      <div className="flex-1 border-r border-zinc-900/50 pr-12">
        {/* Pass a prop to TrackList to fetch reposts specifically */}
        <TrackList userId={controller.userId} type="reposts" />
      </div>
    );
  }

    return (
      <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-xl font-bold mb-6">Seems a little quiet over here</p>
        {isOwner && (
          <button onClick={() => router.push("/upload")} className="bg-white text-black px-8 py-2 rounded hover:bg-[#ff5500] transition duration-300 font-bold text-lg uppercase">
            Upload now
          </button>
        )}
      </div>
    );
  };

  if (controller.isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── PAGE ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden relative">
      <NavBar className="max-w-7xl mx-auto px-6" />
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-6">
        {viewState === "details" ? (
          renderDetailsPage()
        ) : (
          <>
            <div className="relative w-full min-h-65 bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center mt-2">
                <CoverPhoto />
                <AvatarUpload username={displayName} location={location} onUpload={handleAvatarUpload} avatarUrl={avatarUrl} />
                <div className="flex flex-col gap-1.5 items-center md:items-start">
                  <div className="flex items-center gap-2 bg-black px-3 py-1 w-fit">
                    <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tight">{displayName}</h1>
                    {accountType === "ARTIST" && <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-1 rounded-sm font-black uppercase">Artist</span>}
                  </div>
                  {location && <p className="text-neutral-400 text-[10px] bg-black px-2 py-1 w-fit font-bold uppercase">{location}</p>}
                </div>
              </div>
            </div>

            <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40">
              <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12">
                <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
                  {tabs?.map((tab: string) => (
                    <li
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer h-full flex items-center border-b-2 ${activeTab === tab ? "text-white border-white" : "border-transparent hover:text-white"}`}
                    >
                      {tab}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 items-center">
                  {!isOwner && controller.userId && (
                    <FollowButton
                      user={{
                        id: controller.userId,
                        display_name: controller.displayName,
                        handle: controller.handle || "",
                        avatar_url: controller.avatarUrl || "",
                      }}
                    />
                  )}

                  <button
                    onClick={() => setIsShareOpen(true)}
                    className={BUTTON_STYLE}
                  >
                    <FiShare size={15} /> Share
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className={BUTTON_STYLE}
                    >
                      <GrEdit size={15} /> Edit
                    </button>
                  )}

                  {!isOwner && (
                    <ProfileActionsMenu
                      userId={controller.userId || ""}
                      displayName={controller.displayName}
                      isBlocked={false}
                    />
                  )}
                  <button onClick={() => setIsShareOpen(true)} className={BUTTON_STYLE}><FiShare size={15} /> Share</button>
                  {isOwner && <button onClick={() => setIsEditOpen(true)} className={BUTTON_STYLE}><GrEdit size={15} /> Edit</button>}
                </div>
              </div>
            </div>

            <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
              {renderFeedContent()}

              <div className="w-full lg:w-[320px] space-y-10">
                {/* Stats — followingCount is live from the store */}
                <Stats
                  followers={controller.followersCount}
                  following={controller.followingCount}
                  tracks={controller.tracksCount}
                />
                {/* Favorite genres */}
                {favoriteGenres?.length > 0 && (
                  <div className="space-y-1 border-t border-zinc-900 pt-4">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      Favorite Genre
                    </p>
                    {favoriteGenres.map((g) => (
                      <p
                        key={g}
                        className="text-sm font-bold text-white flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {g}
                      </p>
                    ))}
                  </div>
                )}

                <SocialLinksList links={links} />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="font-bold uppercase">{likedTracks.length} Likes</p>
                    <button onClick={() => { setViewState("details"); setDetailTab("Likes"); }} className="hover:text-white font-bold uppercase">View all</button>
                    <p className="font-bold uppercase">{controller.followingCount} Following</p>
                    <button
                      onClick={() => {
                        setViewState("details");
                        setDetailTab("Following");
                      }}
                      className="hover:text-white transition-colors font-bold uppercase"
                    >
                      View all
                    </button>
                  </div>
                  {likedTracks.slice(0, 3).map((track: any) => (
                    <div key={track.trackId || track.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all">
                      <div className="w-10 h-10 bg-zinc-800 rounded relative overflow-hidden">
                        <Image src={track.coverArt || track.imageUrl || "/images/profile.png"} alt="`${ user.name || 'User'}'s profile picture`" fill className="object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{track.title}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{track.artistName}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="font-bold uppercase">👤 {following.length} Following</p>
                    <button onClick={() => { setViewState("details"); setDetailTab("Following"); }} className="hover:text-white font-bold uppercase">View all</button>
                  </div>
                  {following.slice(0, 3).map((user: any) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-zinc-800 bg-zinc-800">
                        <Image src={user.avatar_url || user.avatar || "/images/profile.png"} alt={`${ user.name || 'User'}'s profile picture`} fill className="object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{user.display_name || user.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{user.handle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <EditProfileModal
        isOpen={controller.isEditOpen}
        onClose={() => controller.setIsEditOpen(false)}
        data={{ ...controller }}
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