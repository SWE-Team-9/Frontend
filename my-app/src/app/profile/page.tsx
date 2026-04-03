"use client";

import React from "react";
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

// Fetch current logged-in user ID
import { useEffect, useState } from "react";
import ProfileActionsMenu from "@/src/components/block-user/ProfileActionsMenu";
import axios from "axios";

export default function ProfilePage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/api/v1/auth/me");
        setCurrentUserId(response.data.id);
      } catch (err) {
        console.error("Failed to fetch current user", err);
      }
    };

    fetchCurrentUser();
  }, []);

  const router = useRouter();

  const handleUploadClick = () => {
    router.push("/upload");
  };

  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";
  const controller = useProfileController();
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

  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      {/* Detail View Header */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-linear-to-br from-zinc-700 to-zinc-500 shadow-xl"></div>
        <h2 className="text-3xl font-bold">
          {detailTab} BY {displayName}
        </h2>
      </div>

      {/* Internal Navigation within Details */}
      <div className="border-b border-zinc-800 mb-8">
        <ul className="flex gap-8 text-sm font-bold text-zinc-400">
          {["Likes", "Following", "Followers"].map((t) => (
            <li
              key={t}
              onClick={() => setDetailTab(t)}
              className={`pb-2 cursor-pointer border-b-2 transition-all ${detailTab === t ? "text-white border-white" : "border-transparent hover:text-zinc-200"}`}
            >
              {t.toString()}
            </li>
          ))}
        </ul>
      </div>

      {/* Empty State Placeholders for Details */}
      <div className="py-20 text-center flex flex-col items-center">
        {detailTab === "Likes" && (
          <p className="text-2xl font-bold text-zinc-500">
            YOU HAVE NO LIKES YET.
          </p>
        )}
        {detailTab === "Followers" && (
          <p className="text-2xl font-bold text-zinc-500">
            NO ONE IS FOLLOWING YOU YET.
          </p>
        )}
        {detailTab === "Following" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-white">
              <span className="text-xs font-bold">TRAVIS SCOTT</span>
            </div>
            <p className="font-bold text-xl">
              Travis Scott <span className="text-blue-500">✓</span>
            </p>
          </div>
        )}
        <button
          onClick={() => setViewState("profile")}
          className="mt-12 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all uppercase"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden relative">
      {/* Conditional Rendering: Main Profile vs Details Page */}
      <NavBar className="max-w-7xl mx-auto px-6" />
      <div className="h-16" />{" "}
      {/* Spacer to prevent content from being hidden behind NavBar */}
      <div className="max-w-7xl mx-auto px-6">
        {viewState === "details" ? (
          renderDetailsPage()
        ) : (
          <>
            {/* --- SECTION 1: VISUAL HEADER (Banner & Avatar) --- */}
            <div className="relative w-full min-h-65 bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
                <CoverPhoto />
                <AvatarUpload
                  username={displayName}
                  location={location}
                  onUpload={handleAvatarUpload}
                  avatarUrl={avatarUrl}
                />

                {/* User Identity Information */}
                <div className="flex flex-col gap-1.5 items-center md:items-start">
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
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-neutral-400 text-[10px] md:text-xs bg-black px-2 py-1 w-fit font-bold uppercase">
                        {location}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- SECTION 2: NAVIGATION BAR (Sticky Tabs) --- */}
            <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40 overflow-x-auto">
              <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12 min-w-150 md:min-w-full">
                {/* Main Feed Navigation Tabs */}
                <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
                  {tabs?.map((tab: string) => (
                    <li
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer outline-none focus:outline-none transition-colors h-full flex items-center border-b-2 ${activeTab === tab ? "text-white border-white" : "border-transparent hover:text-white"}`}
                    >
                      {tab}
                    </li>
                  ))}
                </ul>

                {/* Global Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className={BUTTON_STYLE}
                  >
                    <FiShare size={15} /> Share
                  </button>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className={BUTTON_STYLE}
                  >
                    <GrEdit size={15} /> Edit
                  </button>
                  {currentUserId !== controller.userId && ( // Only show Block menu if viewing someone else's profile
                    <ProfileActionsMenu
                      userId={controller.userId}
                      displayName={controller.displayName}
                      isBlocked={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* --- SECTION 3: MAIN LAYOUT (Feed & Sidebar) --- */}
            <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
              {/* Main Content Area (Feed Section) */}
              <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
                <p className="text-zinc-500 text-xl font-bold mb-6">
                  {activeTab === "Playlists"
                    ? "You haven't created any playlists."
                    : activeTab === "Reposts"
                      ? "You haven't reposted any sounds."
                      : "Seems a little quiet over here"}
                </p>
                {activeTab !== "Playlists" && activeTab !== "Reposts" && (
                  <button
                    onClick={handleUploadClick}
                    className="bg-white text-black px-8 py-2 rounded font-bold hover:bg-zinc-200 transition-all uppercase"
                  >
                    Upload now
                  </button>
                )}
              </div>

              {/* Sidebar Column: Contains stats, genres, and social links */}
              <div className="w-full lg:w-[320px] space-y-10">
                {/* Fragmented Statistics Component */}
                <Stats
                  followers={controller.followersCount}
                  following={controller.followingCount}
                  tracks={controller.tracksCount}
                />

                {/* Dynamic Favorite Genre Display */}
                {favoriteGenres.length > 0 && (
                  <div className="space-y-1 mt-6 border-t border-zinc-900 pt-4">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      Favorite Genre
                    </p>
                    {favoriteGenres.map((g) => (
                      <p
                        key={g}
                        className="text-sm font-bold text-white flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {g}
                      </p>
                    ))}
                  </div>
                )}

                {/* Fragmented Social Links List */}
                <SocialLinksList links={links} />

                {/* Following Preview Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-[13px] border-b border-zinc-900 pb-2">
                    <p className="flex items-center gap-2 font-bold uppercase">
                      👥 1 Following
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
                  <div className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 rounded transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-blue-900"></div>
                    <p className="text-sm font-bold">
                      Travis Scott <span className="text-blue-400">✓</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- FRAGMENTED MODALS --- */}

        {/* Modal for editing profile details */}
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

        {/* Share Modal Implementation */}
        {isShareOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] w-full max-w-125 rounded-sm border border-[#333] shadow-2xl overflow-hidden relative">
              {/* Modal Internal Tabs */}
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
                    {/* Social Icon Grid with Official Colors */}
                    <div className="flex gap-4 mb-10">
                      <div
                        title="Twitter"
                        className="w-12.5 h-12.5 rounded-full bg-[#1DA1F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                      >
                        <FaTwitter size={30} />
                      </div>
                      <div
                        title="Facebook"
                        className="w-12.5 h-12.5 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg "
                      >
                        <FaFacebook size={30} />
                      </div>
                      <div
                        title="Tumblr"
                        className="w-12.5 h-12.5 rounded-full bg-[#35465C] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                      >
                        <TiSocialTumbler size={50} />
                      </div>
                      <div
                        title="Pinterest"
                        className="w-12.5 h-12.5 rounded-full bg-[#E60023] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                      >
                        <FaPinterest size={30} />
                      </div>
                      <div
                        title="Email"
                        className="w-12.5 h-12.5 rounded-full bg-[#333] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg border border-zinc-700"
                      >
                        <HiOutlineEnvelope size={30} />
                      </div>
                    </div>
                    {/* Link Copy UI */}
                    <div className="space-y-4">
                      <div className="bg-[#111] border border-[#333] p-1 rounded flex items-center justify-between group">
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
                      {/* Link Shortening Toggle */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="shorten"
                          checked={isShortened}
                          onChange={() => setIsShortened(!isShortened)}
                          className="w-5 h-5 accent-white"
                        />
                        <label
                          htmlFor="shorten"
                          className="text-sm text-white font-bold uppercase"
                        >
                          Shorten link
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Direct Message UI within Modal */
                  <div className="space-y-4 animate-in fade-in duration-300 text-left">
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">
                        To <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#111] border border-[#333] p-2 rounded outline-none focus:border-white text-sm font-bold uppercase"
                      />
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
                      <button className="bg-white text-black px-6 py-1.5 rounded font-bold text-sm hover:bg-zinc-200 uppercase">
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Modal Exit Button */}
              <button
                onClick={() => setIsShareOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl uppercase"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* --- NOTIFICATION LAYER --- */}
        {/* Toast notification for successful updates */}
        {showSuccessToast && (
          <div className="fixed top-20 right-10 z-100 animate-in slide-in-from-right duration-300">
            <div className="bg-[#333] border border-zinc-700 p-4 flex items-center gap-4 shadow-2xl rounded-sm min-w-75">
              <div className="w-12 h-12 bg-zinc-600 flex items-center justify-center rounded-sm">
                <span className="text-zinc-400 text-2xl">👤</span>
              </div>
              <div>
                <p className="text-white text-sm font-bold">
                  Your profile has been updated
                </p>
                <p className="text-white text-sm font-bold">successfully.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
