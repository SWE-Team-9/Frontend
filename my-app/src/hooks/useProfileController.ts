"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useProfileStore } from "@/src/store/useProfileStore";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { socialService } from "@/src/services/socialService";
import { useParams } from "next/navigation"; // Uncommented to fix 'handle' error
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
  getProfileByHandle,
} from "@/src/services/profileService";

/** --- Interfaces --- **/
interface User {
  id: number;
  name: string;
  handle: string;
  followers: string;
  tracks: number;
  isFollowing: boolean;
  avatar: string;
}

interface ServerUser {
  id: string | number;
  display_name?: string;
  name?: string;
  handle?: string;
  followersCount?: number;
  followers?: string | number;
  tracksCount?: number;
  isFollowing?: boolean;
  avatar_url?: string;
  avatar?: string;
}

type AccountType = "ARTIST" | "LISTENER";

export const useProfileController = (targetUserId?: string) => {
  const store = useProfileStore();
  const params = useParams();
  
  // FIX: Extract handle from params or props
  const handle = (params?.handle as string) || "";

  // FIX: Merge activeId and isOwner logic
  const isOwner = !handle || handle === store.handle;
  const activeId = targetUserId || handle || store.handle || "me";

  // ---- UI state ----
  const [activeTab, setActiveTab] = useState("Tracks");
  const [viewState, setViewState] = useState("profile");
  const [detailTab, setDetailTab] = useState("Following");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState("Share");
  const [isShortened, setIsShortened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const hasRequestedProfileRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const favoriteGenres = store.favoriteGenres;
  const resetProfile = useProfileStore((state) => state.resetProfile);
  // ---- Static data ----
  const tabs = ["All", "Popular tracks", "Tracks", "Albums", "Playlists", "Reposts"];
  const genres = ["None", "electronic", "hip-hop", "pop", "rock", "alternative", "ambient", "classical", "jazz", "r-b-soul", "metal", "folk-singer-songwriter", "country", "reggaeton", "dancehall", "drum-bass", "house", "techno", "deep-house", "trance", "lo-fi", "indie", "punk", "blues", "latin", "afrobeat", "trap", "experimental", "world", "gospel", "spoken-word"];

  // ---- Social Lists State (FIXED: Only declare once) ----
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [likesList, setLikesList] = useState([
    {
      id: "track_like_1",
      title: "Super Bowl LX Halftime Show (Live)",
      artist: "Bad Bunny, NFL",
      duration: "13:41",
      timestamp: "1 month ago",
      genre: "Latin",
      cover: "https://i1.sndcdn.com/artworks-Xy7D9X3W-t500x500.jpg",
      isLiked: true,
    },
  ]);

  // ---- Profile links ----
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const longLink = store.handle ? `${origin}/profile/${store.handle}` : `${origin}/profile`;
  const shortLink = longLink;

  // FIX: Added missing handleAvatarUpload function
  const handleAvatarUpload = async (file: File) => {
    try {
      setIsAvatarUploading(true);
      // Logic for avatar upload would go here
      console.log("Uploading avatar...", file);
      const mockImageUrl = URL.createObjectURL(file);
      return mockImageUrl;
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Failed to upload image.");
      return undefined;
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    
    if (store.isLoaded || hasRequestedProfileRef.current || store.useMockData) return;
    hasRequestedProfileRef.current = true;

    try {
      setIsLoading(true);
      const profile = handle ? await getProfileByHandle(handle) : await getMyProfile();

      store.setProfileData({
        userId: profile.id,
        displayName: profile.displayName ?? "",
        handle: profile.handle ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        website: profile.website ?? "",
        avatarUrl: profile.avatarUrl ?? null,
        coverUrl: profile.coverUrl ?? null,
        isPrivate: profile.isPrivate ?? false,
        accountType: (profile.accountType as AccountType) ?? "LISTENER",
        favoriteGenres: profile.favoriteGenres ?? [],
        followersCount: profile.followersCount ?? 0,
        followingCount: profile.followingCount ?? 0,
        tracksCount: profile.tracksCount ?? 0,
        links: profile.externalLinks?.length > 0
          ? profile.externalLinks.map((l: any, i: number) => ({
              id: Date.now() + i,
              platform: l.platform,
              url: l.url,
            }))
          : [{ id: 1, platform: "", url: "" }],
        isLoaded: true,
      });
    } catch (err) {
      console.error("Could not load profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    if (!hasRequestedProfileRef.current) {
    resetProfile(); 
    hasRequestedProfileRef.current = false;
    loadProfile();
  }
  }, [handle, loadProfile, resetProfile]);

  const handleSave = async () => {
    if (!store.displayName.trim()) {
      setError("Display name is required!");
      return;
    }
    if (store.useMockData) {
      setIsEditOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await updateMyProfile({
        display_name: store.displayName,
        bio: store.bio || undefined,
        location: store.location || undefined,
        website: store.website || undefined,
        is_private: store.isPrivate,
        favorite_genres: store.favoriteGenres.filter((g) => g !== "None"),
        account_type: store.accountType,
      });

      const validLinks = store.links
        .filter((l) => l.url.trim() !== "")
        .map((l) => ({ platform: l.platform || "website", url: l.url }));

      await updateMyLinks(validLinks);
      setIsEditOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // FIX: Combined toggleFollow into a single declaration
  const toggleFollow = (userId: number) => {
    const allUsers = [...followersList, ...followingList, ...suggestedUsers];
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextState = !targetUser.isFollowing;

    store.setProfileData({
      followingCount: nextState ? store.followingCount + 1 : Math.max(0, store.followingCount - 1),
    });

    const updateList = (list: User[]) =>
      list.map((u) => (u.id === userId ? { ...u, isFollowing: nextState } : u));

    setFollowersList(prev => updateList(prev));
    setSuggestedUsers(prev => updateList(prev));
    
    if (nextState) {
        setFollowingList(prev => [...prev, { ...targetUser, isFollowing: true }]);
    } else {
        setFollowingList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(isShortened ? shortLink : longLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  const mockTracks = [
    { trackId: "trk_123", title: "Biomedical Beat", artist: { display_name: store.displayName }, durationSeconds: 215, liked: true },
    { trackId: "trk_456", title: "Next.js Rhythm", artist: { display_name: store.displayName }, durationSeconds: 185, liked: false },
  ];

  const displayTracks = store.useMockData ? mockTracks : [];

  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        setIsLoading(true);
        const [followersRes, followingRes] = await Promise.all([
          socialService.getFollowers(activeId),
          socialService.getFollowing(activeId),
        ]);

        const mapServerToUI = (serverUsers: ServerUser[]): User[] =>
          serverUsers.map((u) => ({
            id: typeof u.id === "string" ? parseInt(u.id) : u.id,
            name: u.display_name || u.name || "Unknown User",
            handle: u.handle || "user",
            followers: u.followersCount?.toString() || u.followers?.toString() || "0",
            tracks: u.tracksCount || 0,
            isFollowing: u.isFollowing ?? false,
            avatar: u.avatar_url || u.avatar || "https://ui-avatars.com/api/?name=User",
          }));

        if (!store.useMockData) {
          if (followersRes.data?.data) setFollowersList(mapServerToUI(followersRes.data.data));
          if (followingRes.data?.data) setFollowingList(mapServerToUI(followingRes.data.data));
        }
      } catch (err) {
        console.error("API Integration Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [detailTab, activeId, store.useMockData]);

  const handleLoadMore = () => {
    const nextUser: User = {
      id: Date.now(),
      name: "New Mock User",
      handle: `user_${currentPage + 1}`,
      followers: "1K",
      tracks: 10,
      isFollowing: false,
      avatar: "https://ui-avatars.com/api/?name=New+User",
    };

    if (detailTab === "Following") {
      setFollowingList((prev) => [...prev, nextUser]);
    } else {
      setFollowersList((prev) => [...prev, nextUser]);
    }
    setCurrentPage((prev) => prev + 1);
  };

  const displayUsers = useMemo(() => {
    return detailTab === "Following" ? followingList : followersList;
  }, [detailTab, followingList, followersList]);

  const filteredUsers = useMemo(() => {
    return displayUsers.filter((user: User) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [displayUsers, searchQuery]);

  return {
    ...store,
    isOwner,
    activeId,
    activeTab, setActiveTab,
    viewState, setViewState,
    detailTab, setDetailTab,
    isEditOpen, setIsEditOpen,
    isShareOpen, setIsShareOpen,
    shareTab, setShareTab,
    isShortened, setIsShortened,
    copied, copyToClipboard,
    error, handleSave,
    genres, tabs,
    showSuccessToast,
    longLink, shortLink,
    isSaving, isLoading,
    isAvatarUploading,
    handleAvatarUpload,
    displayTracks,
    toggleFollow,
    likesList,
    setLikesList,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    displayUsers,
    favoriteGenres,
    suggestedUsers,
    handleLoadMore,
    currentPage,
    followingCount: followingList.length,
    followersCount: followersList.length,
  };
};