"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/src/components/ui/NavBar";
import { FiShare } from "react-icons/fi";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto } from "@/src/components/profile/CoverPhoto";
import { GrEdit } from "react-icons/gr";
import { FaFacebook, FaTwitter, FaPinterest } from "react-icons/fa";
import { TiSocialTumbler } from "react-icons/ti";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { useProfileController } from "@/src/hooks/useProfileController";
import { Stats } from "@/src/components/profile/sidebar/Stats";
import { SocialLinksList } from "@/src/components/profile/sidebar/SocialLinksList";
import { EditProfileModal } from "@/src/components/profile/modals/EditProfileModal";
import ProfileActionsMenu from "@/src/components/block-user/ProfileActionsMenu";
import FollowButton from "@/src/components/profile/sidebar/FollowButton";
import { TrackCard } from "@/src/components/tracks/TrackCard";
import Image from "next/image";
import { useFollowStore } from "@/src/store/followStore";
import { useLikeStore } from "@/src/store/likeStore";
import api from "@/src/services/api";
import TrackList from "@/src/components/tracks/TrackList";

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
  const resolvedParams = React.use(params);
  const handle = resolvedParams.handle;

  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const controller = useProfileController(handle);
  const isOwner = currentUserHandle === handle;

  // ── Follow store ──────────────────────────────────────────────────────────
  const following = useFollowStore((state) => state.following || []);
  const followers = useFollowStore((state) => state.followers || []);
  const fetchFollowing = useFollowStore((state) => state.fetchFollowing);
  const fetchFollowers = useFollowStore((state) => state.fetchFollowers);
  const storeToggleFollow = useFollowStore((state) => state.toggleFollow);
  const checkIsFollowing = useFollowStore((state) => state.isFollowing);
  const followError = useFollowStore((state) => state.error);

  // ── Like store ────────────────────────────────────────────────────────────
  const likedTracks = useLikeStore((state) => state.likedTracks || []);
  const likeError = useLikeStore((state) => state.error);

  useEffect(() => {
    if (controller.userId) {
      fetchFollowing(controller.userId);
      fetchFollowers(controller.userId);
    }
  }, [controller.userId, fetchFollowing, fetchFollowers]);

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
    detailTab,
    setDetailTab,
    isShareOpen,
    setIsShareOpen,
    shareTab,
    setShareTab,
    isShortened,
    setIsShortened,
    copied,
    copyToClipboard,
    shortLink,
    longLink,
    showSuccessToast,
    accountType,
    setIsEditOpen,
    handleAvatarUpload,
    avatarUrl,
  } = controller;

  const sourceUsers = detailTab === "Following" ? following : followers;

  const filteredUsers = (sourceUsers as FollowUserShape[]).filter((user) => {
    const name = user.display_name || user.displayName || user.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ─── DETAILS VIEW ─────────────────────────────────────────────────────────
  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
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
              onClick={() => { setDetailTab(t); setSearchQuery(""); }}
              className={`pb-2 cursor-pointer border-b-2 transition-all ${detailTab === t ? "text-white border-white" : "border-transparent hover:text-zinc-200"
                }`}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      {(detailTab === "Following" || detailTab === "Followers") && (
        <div className="max-w-md mb-8">
          <input
            type="text"
            placeholder={`Search ${detailTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white transition-all text-sm"
          />
        </div>
      )}

      <div className="py-10 flex flex-col items-center">
        {followError && <p className="mb-4 text-sm text-red-400">{followError}</p>}
        {likeError && <p className="mb-4 text-sm text-red-400">{likeError}</p>}

        {/* ── LIKES TAB ── */}
        {detailTab === "Likes" &&
          (likedTracks.length === 0 ? (
            <p className="text-2xl font-bold text-zinc-500 uppercase py-24">No likes yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 w-full">
              {likedTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={{
                    trackId: track.id,
                    title: track.title,
                    likesCount: track.likesCount,
                    liked: true,
                    artistName: track.artistName,
                    coverArt: track.coverArt || track.imageUrl,
                  }}
                  isOwner={false}
                />
              ))}
            </div>
          ))}

        {/* ── FOLLOWING / FOLLOWERS TAB ── */}
        {(detailTab === "Following" || detailTab === "Followers") &&
          (filteredUsers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {filteredUsers.map((user) => {
                const name = user.display_name || user.displayName || user.name || "";
                const avatar = user.avatar_url || user.avatarUrl || user.avatar || null;
                const followerCount = user.followersCount || user.followers_count || user.followers || 0;
                const isFollowing = checkIsFollowing(user.id);
                return (
                  <div key={`${detailTab}-${user.id}`} className="flex flex-col items-center text-center group">
                    <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500 transition-all shadow-2xl bg-zinc-900">
                      {avatar ? (
                        <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-3xl font-bold text-zinc-500 uppercase">{name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm uppercase mb-1">{name}</h4>
                    <p className="text-zinc-500 text-[11px] mb-4">{followerCount} followers</p>
                    <button
                      onClick={() =>
                        storeToggleFollow({
                          id: user.id,
                          display_name: name,
                          handle: user.handle ?? "",
                          avatar_url: avatar ?? "",
                        })
                      }
                      className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${isFollowing
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
          ) : (
            <div className="py-20 text-center">
              <p className="text-xl font-bold text-zinc-600 uppercase mb-8">Nothing found.</p>
            </div>
          ))}

        <button
          onClick={() => { setViewState("profile"); setSearchQuery(""); }}
          className="mt-12 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  );

  // ─── FEED CONTENT ─────────────────────────────────────────────────────────
  const renderFeedContent = () => {
    if (activeTab === "Tracks" || activeTab === "All") {
      return (
        <div className="flex-1 border-r border-zinc-900/50 pr-12">
          {controller.userId ? (
            <TrackList userId={controller.userId ?? ""} isOwner={isOwner} />
          ) : (
            <p className="text-sm text-zinc-500">Loading tracks...</p>
          )}
        </div>
      );
    }

    if (activeTab === "Playlists") {
      return (
        <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
          <p className="text-zinc-500 text-xl font-bold">You haven&apos;t created any playlists.</p>
        </div>
      );
    }

    if (activeTab === "Reposts") {
      return (
        <div className="flex-1 border-r border-zinc-900/50 pr-12">
          <TrackList userId={controller.userId ?? ""} type="reposts" isOwner={isOwner} />
        </div>
      );
    }

    return (
      <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-xl font-bold mb-6">Seems a little quiet over here</p>
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
            <div className="relative w-full min-h-65 bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
                <CoverPhoto />
                <AvatarUpload username={displayName} location={location} onUpload={handleAvatarUpload} avatarUrl={avatarUrl} />
                <div className="flex flex-col gap-1.5 items-center md:items-start">
                  <div className="flex flex-col md:flex-row items-center gap-2 bg-black px-3 py-1 w-fit">
                    <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tight">{displayName}</h1>
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
                      className={`cursor-pointer transition-colors h-full flex items-center border-b-2 ${activeTab === tab ? "text-white border-white" : "border-transparent hover:text-white"
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

                  <button onClick={() => setIsShareOpen(true)} className={BUTTON_STYLE}>
                    <FiShare size={15} /> Share
                  </button>

                  {isOwner && (
                    <button onClick={() => setIsEditOpen(true)} className={BUTTON_STYLE}>
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
                    <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Favorite Genre</p>
                    {favoriteGenres.map((g) => (
                      <p key={g} className="text-sm font-bold text-white flex items-center gap-2">
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
                    <p className="font-bold uppercase">{likedTracks.length} Likes</p>
                    <button
                      onClick={() => { setViewState("details"); setDetailTab("Likes"); }}
                      className="hover:text-white transition-colors font-bold uppercase"
                    >
                      View all
                    </button>
                  </div>
                  {likedTracks.length === 0 ? (
                    <p className="text-xs text-zinc-600 font-bold uppercase">No liked tracks yet</p>
                  ) : (
                    likedTracks.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all cursor-pointer"
                        onClick={() => { setViewState("details"); setDetailTab("Likes"); }}
                      >
                        <div className="w-10 h-10 bg-zinc-800 rounded relative overflow-hidden shrink-0">
                          {(track.coverArt || track.imageUrl) && (
                            <Image src={track.coverArt || track.imageUrl || ""} alt={track.title} fill className="object-cover" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{track.title}</p>
                          {track.artistName && (
                            <p className="text-[10px] text-zinc-500 uppercase truncate">{track.artistName}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Following preview ── */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="font-bold uppercase">{controller.followingCount} Following</p>
                    <button
                      onClick={() => { setViewState("details"); setDetailTab("Following"); }}
                      className="hover:text-white transition-colors font-bold uppercase"
                    >
                      View all
                    </button>
                  </div>
                  {following.length === 0 ? (
                    <p className="text-xs text-zinc-600 font-bold uppercase">Not following anyone yet</p>
                  ) : (
                    (following as FollowUserShape[]).slice(0, 3).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all cursor-pointer"
                        onClick={() => { setViewState("details"); setDetailTab("Following"); }}
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
                              {(u.display_name || u.displayName || "?").charAt(0)}
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

        {/* ── SHARE MODAL ── */}
        {isShareOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] w-full max-w-125 rounded-sm border border-[#333] shadow-2xl overflow-hidden relative">
              <div className="flex border-b border-[#333]">
                <button
                  onClick={() => setShareTab("Share")}
                  className={`px-6 py-4 text-sm font-bold transition-all uppercase ${shareTab === "Share" ? "text-white border-b-2 border-white" : "text-zinc-500 hover:text-white"}`}
                >
                  Share
                </button>
                <button
                  onClick={() => setShareTab("Message")}
                  className={`px-6 py-4 text-sm font-bold transition-all uppercase ${shareTab === "Message" ? "text-white border-b-2 border-white" : "text-zinc-500 hover:text-white"}`}
                >
                  Message
                </button>
              </div>
              <div className="p-8 space-y-8">
                {shareTab === "Share" ? (
                  <>
                    <div className="flex gap-4 mb-10">
                      <div className="w-12.5 h-12.5 rounded-full bg-[#1DA1F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg">
                        <FaTwitter size={30} />
                      </div>
                      <div className="w-12.5 h-12.5 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg">
                        <FaFacebook size={30} />
                      </div>
                      <div className="w-12.5 h-12.5 rounded-full bg-[#35465C] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg">
                        <TiSocialTumbler size={50} />
                      </div>
                      <div className="w-12.5 h-12.5 rounded-full bg-[#E60023] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg">
                        <FaPinterest size={30} />
                      </div>
                      <div className="w-12.5 h-12.5 rounded-full bg-[#333] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg border border-zinc-700">
                        <HiOutlineEnvelope size={30} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-[#111] border border-[#333] p-1 rounded flex items-center justify-between">
                        <input
                          readOnly
                          value={isShortened ? shortLink : longLink}
                          className="bg-transparent text-[13px] text-zinc-300 w-full outline-none px-2 font-bold"
                        />
                        <button
                          onClick={copyToClipboard}
                          className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${copied ? "bg-green-600" : "bg-white text-black"}`}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="shorten"
                          checked={isShortened}
                          onChange={() => setIsShortened(!isShortened)}
                          className="w-5 h-5 accent-white"
                        />
                        <label htmlFor="shorten" className="text-sm text-white font-bold uppercase">
                          Shorten link
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300 text-left">
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">
                        To <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full bg-[#111] border border-[#333] p-2 rounded outline-none focus:border-white text-sm font-bold uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        defaultValue={longLink}
                        className="w-full bg-[#111] border border-[#333] p-2 rounded h-32 outline-none focus:border-white text-sm resize-none font-bold uppercase"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button className="bg-white text-black px-6 py-1.5 rounded font-bold text-sm hover:bg-zinc-200 uppercase">Send</button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setIsShareOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl">
                ×
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS TOAST ── */}
        {showSuccessToast && (
          <div className="fixed top-20 right-10 z-100 animate-in slide-in-from-right duration-300">
            <div className="bg-[#333] border border-zinc-700 p-4 flex items-center gap-4 shadow-2xl rounded-sm min-w-75">
              <p className="text-white text-sm font-bold">Your profile has been updated successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}