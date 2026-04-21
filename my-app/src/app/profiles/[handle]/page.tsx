"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import ProfileActionsMenu from "@/src/components/block-user/ProfileActionsMenu";
import FollowButton from "@/src/components/profile/sidebar/FollowButton";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import Image from "next/image";
import { useFollowStore } from "@/src/store/followStore";
// import { useLikeStore } from "@/src/store/likeStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import TrackList from "@/src/components/tracks/TrackList";
import Link from "next/link";
import { TrackData } from "@/src/types/interactions";
import { getUserLikes } from "@/src/services/likeService";
import SharePopup from "@/src/components/share/SharePopup";

type FollowUserShape = {
  id: string;
  handle?: string;
  display_name?: string;
  displayName?: string;
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  avatar?: string;
  followersCount?: number;
  followers_count?: number;
  followers?: number;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const [shareOpen, setShareOpen] = useState(false); // permalink state to be used in the SharePopup
  const resolvedParams = React.use(params);
  const handle = resolvedParams.handle;
  const [searchQuery, setSearchQuery] = useState("");
  const controller = useProfileController(handle);
  // Destructure detailTab and setDetailTab early to avoid 'used before declaration' errors
  const { detailTab, setDetailTab } = controller;
  const setProfileData = useProfileStore((state) => state.setProfileData);
  const isOwner = controller.isOwner;
  // Follow store
  const following = useFollowStore((state) => state.profileFollowing || []);
  const followers = useFollowStore((state) => state.profileFollowers || []);
  const fetchFollowing = useFollowStore((state) => state.fetchFollowing);
  const fetchFollowers = useFollowStore((state) => state.fetchFollowers);
  const storeToggleFollow = useFollowStore((state) => state.toggleFollow);
  const checkIsFollowing = useFollowStore((state) => state.isFollowing);
  const [followingPage, setFollowingPage] = useState(1);
  const FOLLOW_LIMIT = 20; // Number of items per page for following pagination
  const [followersPage, setFollowersPage] = useState(1);

  // ── Like store ────────────────────────────────────────────────────────────
  const [profileLikes, setProfileLikes] = useState<TrackData[]>([]);
  const [isLikesLoading, setIsLikesLoading] = useState(false);
  const [likesPage, setLikesPage] = useState(1);
  const LIKES_LIMIT = 10;
  const [tracksPage, setTracksPage] = useState(1);
const TRACKS_LIMIT = 10;
  // Clear stale data immediately the moment the handle changes
  // 1. Reset data when handle changes
  useEffect(() => {
    useFollowStore.setState({ profileFollowing: [], profileFollowers: [] });
  }, [handle]);

  // 2. Fetch profile likes based on the current page
  useEffect(() => {
    let isMounted = true;

    const fetchLikes = async () => {
      if (!controller.userId) return;

      try {
        setIsLikesLoading(true);
        // Ensure getUserLikes is called with userId, page, and limit
        const data = await getUserLikes(
          controller.userId,
          likesPage,
          LIKES_LIMIT,
        );

        if (!isMounted) return;

        const cleanedData = data.map((t: TrackData) => ({
          ...t,
          artistName: t.artistName ?? undefined,
          coverArt: t.coverArt ?? undefined,
        }));
        setProfileLikes(cleanedData as TrackData[]);
      } catch (err) {
        if (isMounted) console.error("Failed to fetch profile likes:", err);
      } finally {
        if (isMounted) setIsLikesLoading(false);
      }
    };

    if (detailTab === "Likes") {
      fetchLikes();
    }

    return () => {
      isMounted = false;
    };
  }, [controller.userId, likesPage, detailTab]);
  // Fetch Following data based on current page
  useEffect(() => {
    if (controller.userId && detailTab === "Following") {
      useFollowStore.setState({ profileFollowing: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetchFollowing as any)(controller.userId, {
        syncProfileList: true,
        page: followingPage,
        limit: FOLLOW_LIMIT,
      });
    }
  }, [controller.userId, followingPage, detailTab, fetchFollowing]);

  // Fetch Followers based on current page
  useEffect(() => {
    if (controller.userId && detailTab === "Followers") {
      useFollowStore.setState({ profileFollowers: [] });
      fetchFollowers(controller.userId, {
        syncProfileList: true,
        page: followersPage,
        limit: FOLLOW_LIMIT,
      });
    }
  }, [controller.userId, followersPage, detailTab, fetchFollowers]);

  const router = useRouter();

  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";



  const {
    displayName,
    location,
    favoriteGenres,
    links,
    activeTab,
    setActiveTab,
    tabs,
    viewState,
    setViewState,
    showSuccessToast,
    accountType,
    setIsEditOpen,
    handleAvatarUpload,
    avatarUrl,
    coverUrl,
    handleCoverUpload,
  } = controller;

  const sourceUsers = detailTab === "Following" ? following : followers;

  const filteredUsers = (sourceUsers as FollowUserShape[]).filter((user) => {
    const name = user.display_name || user.displayName || user.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleTracksTotalChange = useCallback(
    (nextTotal: number) => {
      setProfileData({ tracksCount: nextTotal });
    },
    [setProfileData],
  );

  // ─── DETAILS VIEW ─────────────────────────────────────────────────────────
  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold uppercase text-zinc-400">
              {displayName?.charAt(0)}
            </span>
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
                detailTab === t
                  ? "text-white border-white"
                  : "border-transparent hover:text-zinc-200"
              }`}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* ── FOLLOWING / FOLLOWERS TAB ── */}
      {(detailTab === "Following" || detailTab === "Followers") &&
        (filteredUsers.length > 0 ? (
          <div className="flex flex-col items-center w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {filteredUsers.map((user) => {
                const name =
                  user.display_name || user.displayName || user.name || "";
                const avatar =
                  user.avatar_url || user.avatarUrl || user.avatar || null;
                const followerCount =
                  (user as FollowUserShape).followersCount || 0;
                const isFollowing = checkIsFollowing(user.id);

                return (
                  <div
                    key={`${detailTab}-${user.id}`}
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
                      <p className="text-zinc-500 text-[11px] mb-4">
                        {followerCount} followers
                      </p>
                    </Link>
                    <button
                      onClick={() =>
                        storeToggleFollow({
                          id: user.id,
                          display_name: name,
                          handle: user.handle ?? "",
                          avatar_url: avatar ?? "",
                        })
                      }
                      className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${isFollowing ? "bg-zinc-800 text-zinc-400 border border-zinc-700" : "bg-white text-black hover:bg-zinc-200"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── PAGINATION CONTROLS (Common for both) ── */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                disabled={
                  detailTab === "Following"
                    ? followingPage === 1
                    : followersPage === 1
                }
                onClick={() => {
                  if (detailTab === "Following")
                    setFollowingPage((prev) => prev - 1);
                  else setFollowersPage((prev) => prev - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
              >
                Previous
              </button>

              <span className="text-white font-black text-sm uppercase tracking-widest">
                Page {detailTab === "Following" ? followingPage : followersPage}
              </span>

              <button
                disabled={filteredUsers.length < FOLLOW_LIMIT}
                onClick={() => {
                  if (detailTab === "Following")
                    setFollowingPage((prev) => prev + 1);
                  else setFollowersPage((prev) => prev + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-xl font-bold text-zinc-600 uppercase mb-8">
              Nothing found.
            </p>
          </div>
        ))}
{/* ── LIKES GRID DISPLAY & PAGINATION ── */}
      {/* This section renders the liked tracks and their specific pagination controls */}
      {detailTab === "Likes" && (
        profileLikes.length === 0 ? (
          <div className="py-20 text-center w-full">
            <p className="text-xl font-bold text-zinc-600 uppercase">No likes found.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Grid layout for displaying Track Cards */}
<div className="grid grid-cols-1 gap-6 w-full max-w-5xl">
                {profileLikes.map((track) => (
                <TrackCard
                  key={track.id}
                  track={{
                    trackId: track.id,
                    title: track.title,
                    // artistName: track.artistName,
                    // coverArt: track.coverArt,
                    likesCount: track.likesCount,
                    liked: true 
                  }}
                  isOwner={isOwner}
                />
              ))}
            </div>

            {/* Pagination Controls for Likes Tab */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                disabled={likesPage === 1}
                onClick={() => {
                  setLikesPage((prev) => prev - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
              >
                Previous
              </button>

              <span className="text-white font-black text-sm uppercase tracking-widest">
                Page {likesPage}
              </span>

              <button
                // Disable Next button if current page items are fewer than the limit
                disabled={profileLikes.length < LIKES_LIMIT}
                onClick={() => {
                  setLikesPage((prev) => prev + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        )
      )}

      {/* Back to Profile Button - Stays at the bottom of all tabs */}
      <button
        onClick={() => {
          setViewState("profile");
          setSearchQuery("");
        }}
        className="mt-12 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase"
      >
        ← Back to Profile
      </button>
    </div>
  );

  // ─── FEED CONTENT ─────────────────────────────────────────────────────────
  const renderFeedContent = () => {
    if (activeTab === "Tracks" || activeTab === "All") {
      return (
        <div className="flex-1 border-r border-zinc-900/50 pr-12">
          {controller.userId ? (
            <div className="flex flex-col">
              {/* Main Track List with Pagination Props */}
              <TrackList
                userId={controller.userId ?? ""}
                page={tracksPage}
                limit={TRACKS_LIMIT}
                type="tracks"
                isOwner={isOwner}
                onTracksTotalChange={handleTracksTotalChange}
              />

              {/* ── TRACKS PAGINATION CONTROLS ── */}
              {/* Only show pagination if there are tracks to navigate through */}
              {controller.tracksCount > 0 && (
                <div className="flex justify-center items-center gap-6 mt-12 mb-10">
                  <button
                    disabled={tracksPage === 1}
                    onClick={() => {
                      setTracksPage((prev) => prev - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
                  >
                    Previous
                  </button>

                  <span className="text-white font-black text-sm uppercase tracking-widest">
                    Page {tracksPage}
                  </span>

                  <button
                    // Disable next button if the current page covers all available tracks
                    disabled={tracksPage * TRACKS_LIMIT >= controller.tracksCount}
                    onClick={() => {
                      setTracksPage((prev) => prev + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2 bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 hover:bg-zinc-700 transition uppercase text-xs border border-zinc-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
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
          <TrackList
            userId={controller.userId ?? ""}
            type="reposts"
            isOwner={isOwner}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-xl font-bold mb-6">
          Seems a little quiet over here
        </p>
        {isOwner && (
          <button
            onClick={() => router.push("/upload")}
            className="bg-white text-black px-8 py-2 rounded hover:bg-[#ff5500] transition duration-300 cursor-pointer font-bold text-lg uppercase"
          >
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

  // ─── PAGE ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden relative">
      <NavBar className="max-w-7xl mx-auto px-6" />
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-6">
        {viewState === "details" ? (
          renderDetailsPage()
        ) : (
          <>
            {/* ── SECTION 1: VISUAL HEADER ── */}
            <div className="relative w-full min-h-65 bg-linear-to-r from-[#8D8284] via-[#89747C] to-[#866975] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
                <CoverPhoto
                  isOwner={isOwner}
                  coverUrl={coverUrl}
                  onUpload={handleCoverUpload}
                />
                <AvatarUpload
                  username={displayName}
                  location={location}
                  onUpload={handleAvatarUpload}
                  avatarUrl={avatarUrl}
                  isOwner={isOwner}
                />
                <div className="flex flex-col gap-1.5 items-center md:items-start relative z-20">
                  <div className="flex flex-col md:flex-row items-center gap-2 bg-black px-3 py-1 w-fit">
                    <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tight">
                      {displayName}
                    </h1>
                    {accountType === "ARTIST" && (
                      <span className="bg-zinc-800 text-zinc-400 text-[10px] md:text-[12px] px-2 py-1 rounded-sm font-black uppercase border border-zinc-700/50 shadow-sm shrink-0">
                        Artist
                      </span>
                    )}
                  </div>
                  {location && (
                    <p className="text-neutral-400 text-[10px] md:text-xs bg-black px-2 py-1 w-fit font-bold uppercase">
                      {location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION 2: STICKY TABS + ACTIONS ── */}
            <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40 overflow-visible">
              <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12 min-w-150 md:min-w-full">
                <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
                  {tabs?.map((tab: string) => (
                    <li
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer transition-colors h-full flex items-center border-b-2 ${
                        activeTab === tab
                          ? "text-white border-white"
                          : "border-transparent hover:text-white"
                      }`}
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

                  <div className="relative">
                    <button
                      onClick={() => setShareOpen((v) => !v)}
                      className={BUTTON_STYLE}
                    >
                      <FiShare size={15} /> Share
                    </button>

                    {shareOpen && controller.handle && (
                      <SharePopup
                        permalink={`/${controller.handle}`}
                        onClose={() => setShareOpen(false)}
                      />
                    )}
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className={BUTTON_STYLE}
                    >
                      <GrEdit size={15} /> Edit
                    </button>
                  )}

                  {controller.userId && !isOwner && (
                    <ProfileActionsMenu
                      userId={controller.userId || ""}
                      displayName={controller.displayName}
                      isBlocked={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: FEED + SIDEBAR ── */}
            <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
              {renderFeedContent()}

              <div className="w-full lg:w-[320px] space-y-10">
                <Stats
                  followers={controller.followersCount}
                  following={controller.followingCount}
                  tracks={controller.tracksCount}
                />

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

                {/* ── Likes preview ── */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="font-bold uppercase">
                      {profileLikes.length} Likes
                    </p>
                    <button
                      onClick={() => {
                        setViewState("details");
                        setDetailTab("Likes");
                      }}
                      className="hover:text-white transition-colors font-bold uppercase"
                    >
                      View all
                    </button>
                  </div>
                  {isLikesLoading ? (
                    <p className="text-xs text-zinc-600 font-bold uppercase animate-pulse">
                      Loading likes...
                    </p>
                  ) : profileLikes.length === 0 ? (
                    <p className="text-xs text-red-400 font-bold uppercase">
                      No liked tracks yet
                    </p>
                  ) : (
                    profileLikes.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all cursor-pointer"
                        onClick={() => {
                          setViewState("details");
                          setDetailTab("Likes");
                        }}
                      >
                        <div className="w-10 h-10 bg-zinc-800 rounded relative overflow-hidden shrink-0">
                          {(track.coverArt || track.imageUrl) && (
                            <Image
                              src={track.coverArt || track.imageUrl || ""}
                              alt={track.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">
                            {track.title}
                          </p>
                          {track.artistName && (
                            <p className="text-[10px] text-zinc-500 uppercase truncate">
                              {track.artistName || "Unknown Artist"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Following preview ── */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="font-bold uppercase">
                      {controller.followingCount} Following
                    </p>
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
                  {following.length === 0 ? (
                    <p className="text-xs text-zinc-600 font-bold uppercase">
                      Not following anyone yet
                    </p>
                  ) : (
                    (following as FollowUserShape[]).slice(0, 3).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all cursor-pointer"
                        onClick={() => {
                          setViewState("details");
                          setDetailTab("Following");
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-700 shrink-0 overflow-hidden border border-zinc-800">
                          {u.avatar_url || u.avatarUrl ? (
                            <Image
                              src={u.avatar_url || u.avatarUrl || ""}
                              alt={u.display_name || u.displayName || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
                              {(u.display_name || u.displayName || "?").charAt(
                                0,
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold truncate">
                          {u.display_name || u.displayName || "Unknown"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── EDIT MODAL ── */}
        <EditProfileModal
          key={
            controller.isEditOpen ? "edit-profile-open" : "edit-profile-closed"
          }
          isOpen={controller.isEditOpen}
          onClose={() => controller.setIsEditOpen(false)}
          data={{
            displayName: controller.displayName,
            handle: controller.handle,
            bio: controller.bio,
            location: controller.location,
            website: controller.website,
            accountType: controller.accountType,
            favoriteGenres: controller.favoriteGenres,
            genres: controller.genres,
            links: controller.links,
            isPrivate: controller.isPrivate,
            error: controller.error,
            isSaving: controller.isSaving,
          }}
          handlers={controller}
        />

        {/* ── SUCCESS TOAST ── */}
        {showSuccessToast && (
          <div className="fixed top-20 right-10 z-100 animate-in slide-in-from-right duration-300">
            <div className="bg-[#333] border border-zinc-700 p-4 flex items-center gap-4 shadow-2xl rounded-sm min-w-75">
              <p className="text-white text-sm font-bold">
                Your profile has been updated successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
