"use client";

import React from "react";
import { FiShare } from "react-icons/fi";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto} from "@/src/components/profile/CoverPhoto";
import { GrEdit } from "react-icons/gr";
import { FaFacebook, FaTwitter, FaPinterest } from "react-icons/fa";
import { TiSocialTumbler } from "react-icons/ti";
import { useProfileController } from "@/src/hooks/useProfileController";
import { SocialLinkInput } from "@/src/components/ui/SocialLinkInput";
import { PrivacyToggle } from "@/src/components/ui/PrivacyToggle";
import { HiOutlineEnvelope } from "react-icons/hi2";
import NavBar from "@/src/components/ui/NavBar";



// Implements the View layer of the MVC pattern, delegating logic to useProfileController.

export default function ProfilePage() {
  const BUTTON_STYLE =
    "bg-zinc-800/50 border border-zinc-700 px-4 py-1 rounded text-xs font-bold hover:bg-zinc-700 transition-colors uppercase flex items-center gap-2";
  // Destructure state and handlers from the Controller (Logic Layer)
  const {
    displayName,
    firstName,
    lastName,
    city,
    country,
    bio,
    profileUrl,
    accountTier,
    setProfileData,
    genre,
    genres,
    isPrivate,
    togglePrivate,
    links,
    addLink,
    removeLink,
    updateLink,
    isEditOpen,
    setIsEditOpen,
    handleSave,
    error,
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
  } = useProfileController();

  // Renders the Details sub-page
  const renderDetailsPage = () => (
    <div className="container mx-auto px-8 py-10 animate-in fade-in duration-500">
      {/* Detail Header Section */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-32 h-32 rounded-full bg-linear-to-br from-zinc-700 to-zinc-500 shadow-xl"></div>
        <h2 className="text-3xl font-bold">
          {detailTab} BY {displayName}
        </h2>
      </div>

      {/* Internal Navigation for Details */}
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

      {/* Detail Content Area */}
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
            <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-[#f50]">
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
    <div className="min-h-screen pt-16 bg-[#121212] text-white font-sans overflow-x-hidden relative max-w-7xl mx-auto px-6">
      <NavBar />

      {/* Conditional Rendering based on viewState */}
      {viewState === "details" ? (
        renderDetailsPage()
      ) : (
        <>
         {/* --- SECTION 1: VISUAL HEADER --- */}
<div className="relative w-full min-h-[300px] bg-[#d38b7d] overflow-hidden">

  {/* Cover as full background */}
  <CoverPhoto />

  {/* Content on top */}
  <div className="absolute inset-0 p-4 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">

    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-center md:text-left mt-4">
      
      <AvatarUpload username={""} />

      {/* Identity Info */}
      <div className="flex flex-col gap-2 items-center md:items-start">
        
        <div className="flex flex-col md:flex-row items-center gap-2 bg-black px-3 py-1 w-fit">
          <h1 className="text-2xl md:text-4xl font-bold">
            {displayName}
          </h1>

          {accountTier === "Artist" && (
            <span className="bg-[#f50] text-[8px] md:text-[10px] px-2 py-0.5 rounded font-black uppercase">
              Artist
            </span>
          )}
        </div>

        {(city || country) && (
          <div className="flex items-center gap-1 mt-1">
            <p className="text-neutral-400 text-xs md:text-sm bg-black px-2 py-1 w-fit font-bold uppercase">
              {city}
              {city && country ? ", " : ""}
              {country}
            </p>
          </div>
        )}

      </div>
    </div>

  </div>
</div>

          {/* --- SECTION 2: NAVIGATION BAR (Sticky) --- */}
          <div className="border-b border-zinc-800 bg-[#121212] sticky top-0 z-40 overflow-x-auto">
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-12 min-w-150 md:min-w-full">
              {/* Tab List */}
              <ul className="flex gap-8 text-[14px] font-bold text-zinc-400 h-full">
                {tabs?.map((tab: string) => (
                  <li
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer transition-colors h-full flex items-center border-b-2 ${activeTab === tab ? "text-white border-[#f50]" : "border-transparent hover:text-white"}`}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
              {/* Action Buttons */}
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
              </div>
            </div>
          </div>

          {/* --- SECTION 3: MAIN PAGE CONTENT & SIDEBAR --- */}
          <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 text-left">
            {/* Feed / Placeholder Section */}
            <div className="flex-1 text-center py-20 border-r border-zinc-900/50 pr-12 flex flex-col items-center justify-center">
              <p className="text-zinc-500 text-xl font-bold mb-6">
                {activeTab === "Playlists"
                  ? "You haven't created any playlists."
                  : activeTab === "Reposts"
                    ? "You haven't reposted any sounds."
                    : "Seems a little quiet over here"}
              </p>
              {activeTab !== "Playlists" && activeTab !== "Reposts" && (
                <button className="bg-white text-black px-8 py-2 rounded font-bold hover:bg-zinc-200 transition-all uppercase">
                  Upload now
                </button>
              )}
            </div>

            {/* User Statistics Sidebar */}
            <div className="w-full lg:w-[320px] space-y-10">
              <div className="flex justify-between border-b border-zinc-900 pb-4 text-center">
                <div>
                  <p className="text-zinc-500 text-[10px] font-bold mb-1">
                    Followers
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-bold mb-1">
                    Following
                  </p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-bold mb-1">
                    Tracks
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>

              {genre && genre !== "None" && (
                <div className="space-y-1 mt-6 border-t border-zinc-900 pt-4">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                    Favorite Genre
                  </p>
                  <p className="text-sm font-bold text-[#f50] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f50]"></span>
                    {genre}
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-zinc-900 pt-4">
                <p className="text-zinc-500 text-[10px] font-bold uppercase mb-3">
                  Social Links
                </p>

                <div className="space-y-2">
                  {links &&
                  links.filter((link) => link.url.trim() !== "").length > 0 ? (
                    links
                      .filter((link) => link.url.trim() !== "")
                      .map((link) => (
                        <a
                          key={link.id}
                          href={
                            link.url.startsWith("http")
                              ? link.url
                              : `https://${link.url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors text-sm group"
                        >
                          <span className="text-[10px] group-hover:scale-110 transition-transform">
                            🔗
                          </span>
                          <span className="truncate">
                            {link.title || link.url.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ))
                  ) : (
                    <p className="text-zinc-600 text-xs italic">
                      No social links added
                    </p>
                  )}
                </div>
              </div>

              {/* Following List Preview */}
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

      {/* --- MODAL 1: EDIT PROFILE --- */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1a1a1a] w-full max-w-200 rounded-lg border border-zinc-800 shadow-2xl my-8 overflow-hidden">
            <div className="p-8 pb-0">
              <h2 className="text-[28px] font-bold text-white mb-2 uppercase">
                Edit your Profile
              </h2>
            </div>

            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Validation Error Message */}
              {error && (
                <div className="mx-8 mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-xs font-bold uppercase animate-pulse">
                  {error}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="p-8 space-y-8 text-left"
              >
                <div className="flex flex-col md:flex-row gap-12">
                  {/* Image Upload Area */}
                  <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                    <div className="w-60 h-60 rounded-full bg-zinc-700 shadow-2xl flex items-center justify-center relative group">
                      <span className="text-[10px] font-bold uppercase">
                        Avatar
                      </span>
                      <button
                        type="button"
                        className="absolute bottom-10 bg-black text-white px-4 py-1.5 rounded text-[12px] font-bold border border-white/20 uppercase"
                      >
                        Upload image
                      </button>
                    </div>
                  </div>

                  {/* Form Data Inputs */}
                  <div className="flex-1 space-y-6">
                    {/* Display Name Input */}
                    <div>
                      <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                        Display name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) =>
                          setProfileData({ displayName: e.target.value })
                        }
                        className={`w-full bg-[#333] border p-2 rounded text-white font-bold outline-none focus:border-orange-500 ${error.includes("name") ? "border-red-500" : "border-zinc-800"}`}
                      />
                    </div>

                    {/* Profile URL Custom Field */}
                    <div>
                      <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                        Profile URL <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center bg-[#333] border border-zinc-800 rounded p-2">
                        <span className="text-zinc-500 text-sm font-bold mr-2 uppercase">
                          soundcloud.com/
                        </span>
                        <input
                          type="text"
                          value={profileUrl}
                          onChange={(e) =>
                            setProfileData({ profileUrl: e.target.value })
                          }
                          className="bg-transparent text-white font-bold outline-none w-full"
                        />
                      </div>
                    </div>

                    {/* Account Tier Switcher */}
                    <div className="space-y-3">
                      <label className="block text-[13px] font-bold text-white uppercase">
                        Account Type
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setProfileData({ accountTier: "Artist" })
                          }
                          className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${accountTier === "Artist" ? "bg-[#f50] text-white" : "bg-transparent border border-zinc-700 text-zinc-400"}`}
                        >
                          Artist
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProfileData({ accountTier: "Listener" })
                          }
                          className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${accountTier === "Listener" ? "bg-white text-black" : "bg-transparent border border-zinc-700 text-zinc-400"}`}
                        >
                          Listener
                        </button>
                      </div>
                    </div>

                    {/* Personal Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                          First name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) =>
                            setProfileData({ firstName: e.target.value })
                          }
                          className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                          Last name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) =>
                            setProfileData({ lastName: e.target.value })
                          }
                          className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Geographic Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) =>
                            setProfileData({ city: e.target.value })
                          }
                          className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) =>
                            setProfileData({ country: e.target.value })
                          }
                          className={`w-full bg-[#333] border p-2 rounded text-white font-bold outline-none ${error.includes("Country") ? "border-red-500" : "border-zinc-800"}`}
                        />
                      </div>
                    </div>

                    {/* Favorite Genre Selection */}
                    <div>
                      <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                        Favorite Genre
                      </label>
                      <select
                        value={genre}
                        onChange={(e) =>
                          setProfileData({ genre: e.target.value })
                        }
                        className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold outline-none focus:border-orange-500"
                      >
                        {genres?.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bio Textarea */}
                    <div>
                      <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                        Bio <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) =>
                          setProfileData({ bio: e.target.value })
                        }
                        className={`w-full bg-[#333] border p-2 rounded h-28 text-white font-bold resize-none outline-none focus:border-orange-500 ${error.includes("Bio") ? "border-red-500" : "border-zinc-800"}`}
                        placeholder="Tell the world a little bit about yourself."
                      />
                    </div>

                    {/* Custom Social Links Management Section */}
                    <div className="space-y-4 pt-6 border-t border-zinc-800">
                      <label className="text-[14px] font-bold text-white uppercase flex items-center gap-2">
                        Your links{" "}
                        <span className="w-4 h-4 rounded-full bg-zinc-700 text-[10px] flex items-center justify-center uppercase">
                          i
                        </span>
                      </label>
                      {links?.map(
                        (link: { id: number; url: string; title: string }) => (
                          <SocialLinkInput
                            key={link.id}
                            link={link}
                            onRemove={removeLink}
                            onChange={updateLink}
                          />
                        ),
                      )}
                      <button
                        type="button"
                        onClick={addLink}
                        className="bg-[#333] hover:bg-[#444] text-white text-[13px] font-bold py-1.5 px-6 rounded transition-all border border-zinc-700 uppercase"
                      >
                        Add link
                      </button>
                    </div>

                    {/* Privacy Settings Component */}
                    <PrivacyToggle
                      isPrivate={isPrivate}
                      onToggle={togglePrivate}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-[#1a1a1a]">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-white font-bold hover:text-zinc-400 transition-colors uppercase text-sm px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-[#f50] hover:bg-orange-600 px-8 py-2 rounded font-bold text-white shadow-lg transition-all uppercase text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SHARE MODAL --- */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] w-full max-w-125 rounded-sm border border-[#333] shadow-2xl overflow-hidden relative">
            {/* Modal Tab Headers */}
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
                    {/* Twitter*/}
                    <div
                      title="Twitter"
                      className="w-12.5 h-12.5 rounded-full bg-[#1DA1F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                    >
                      <FaTwitter size={30} />
                    </div>
                    {/* Facebook */}
                    <div
                      title="Facebook"
                      className="w-12.5 h-12.5 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg "
                    >
                      <FaFacebook size={30} />
                    </div>
                    {/* Tumblr */}
                    <div
                      title="Tumblr"
                      className="w-12.5 h-12.5 rounded-full bg-[#35465C] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                    >
                      <TiSocialTumbler size={50} />
                    </div>
                    {/* Pinterest */}
                    <div
                      title="Pinterest"
                      className="w-12.5 h-12.5 rounded-full bg-[#E60023] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"
                    >
                      <FaPinterest size={30} />
                    </div>
                    {/* Email / Mail */}
                    <div
                      title="Email"
                      className="w-12.5 h-12.5 rounded-full bg-[#333] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg border border-zinc-700"
                    >
                      <HiOutlineEnvelope size={30} />
                    </div>
                  </div>

                  {/* Share Link with Copy Feature */}
                  <div className="space-y-4">
                    <div className="bg-[#111] border border-[#333] p-1 rounded flex items-center justify-between group">
                      <input
                        readOnly
                        value={isShortened ? shortLink : longLink}
                        className="bg-transparent text-[13px] text-zinc-300 w-full outline-none px-2 font-bold"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${copied ? "bg-green-600" : "bg-[#f50]"}`}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    {/* Shorten URL Toggle */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="shorten"
                        checked={isShortened}
                        onChange={() => setIsShortened(!isShortened)}
                        className="w-5 h-5 accent-orange-600"
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
                /* Message Sub-tab Content */
                <div className="space-y-4 animate-in fade-in duration-300 text-left">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-[#333] p-2 rounded outline-none focus:border-orange-500 text-sm font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      defaultValue={longLink}
                      className="w-full bg-[#111] border border-[#333] p-2 rounded h-32 outline-none focus:border-orange-500 text-sm resize-none font-bold uppercase"
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
            {/* Modal Close Button */}
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl uppercase"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
  );
}
