import { useProfileStore } from "@/src/store/useProfileStore";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { socialService } from "@/src/services/followService";
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
  uploadProfileImage,
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

export const useProfileController = (handle?: string) => {
  const store = useProfileStore();
  
  // Determine if the user is looking at their own profile
  const isOwner = !handle || handle === store.handle;
  const activeId = handle || store.handle || "me";

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

  // ---- Static Data ----
  const tabs = ["All", "Popular tracks", "Tracks", "Albums", "Playlists", "Reposts"];
  const genres = [
    "None", "electronic", "hip-hop", "pop", "rock", "alternative",
    "ambient", "classical", "jazz", "r-b-soul", "metal",
    "folk-singer-songwriter", "country", "reggaeton", "dancehall",
    "drum-bass", "house", "techno", "deep-house", "trance",
    "lo-fi", "indie", "punk", "blues", "latin",
    "afrobeat", "trap", "experimental", "world", "gospel", "spoken-word",
  ];

  // ---- Social Lists State ----
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState([
    { id: 301, name: "Mazen LoFi", reason: "Shared genres", isFollowing: false, avatar: "" },
  ]);

  // ---- Profile links ----
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const profileBase = handle ? `profiles/${handle}` : "profile";
  const longLink = `${origin}/${profileBase}`;
  const shortLink = longLink;

  // ──────────────────────────────────────────
  //  FETCH Profile Logic
  // ──────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (hasRequestedProfileRef.current) return;
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
  }, [handle, store]);

  useEffect(() => {
    store.resetProfile(); 
    hasRequestedProfileRef.current = false;
    loadProfile();
  }, [handle]);

  // ──────────────────────────────────────────
  //  Social Data (Followers/Following)
  // ──────────────────────────────────────────
  useEffect(() => {
    const fetchSocialData = async () => {
      if (store.useMockData) return;
      try {
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

        if (followersRes && Array.isArray(followersRes)) setFollowersList(mapServerToUI(followersRes));
        if (followingRes && Array.isArray(followingRes)) setFollowingList(mapServerToUI(followingRes));
      } catch (err) {
        console.error("API Integration Error:", err);
      }
    };
    fetchSocialData();
  }, [activeId, store.useMockData]);

  // ──────────────────────────────────────────
  //  Actions (Save, Follow, Upload)
  // ──────────────────────────────────────────
  const handleSave = async () => {
    if (!store.displayName.trim()) {
      setError("Display name is required!");
      return;
    }
    try {
      setIsSaving(true);
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

  const toggleFollow = (userId: number) => {
    const allUsers = [...followersList, ...followingList, ...suggestedUsers];
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextState = !targetUser.isFollowing;

    // Update Sidebar Optimistically
    store.setProfileData({
      followingCount: nextState ? store.followingCount + 1 : Math.max(0, store.followingCount - 1),
    });

    const updateList = (list: any[]) =>
      list.map((u) => (u.id === userId ? { ...u, isFollowing: nextState } : u));

    setFollowersList(prev => updateList(prev));
    setSuggestedUsers(prev => updateList(prev));
    
    if (nextState) {
        setFollowingList(prev => [...prev, { ...targetUser, isFollowing: true } as User]);
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

  const displayUsers = useMemo(() => (detailTab === "Following" ? followingList : followersList), [detailTab, followingList, followersList]);
  const filteredUsers = useMemo(() => displayUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())), [displayUsers, searchQuery]);

  return {
    ...store,
    isOwner,
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
    handleAvatarUpload: (file: File) => uploadProfileImage("avatar", file),
    toggleFollow,
    searchQuery, setSearchQuery,
    filteredUsers,
    displayUsers,
    suggestedUsers,
    followingCount: followingList.length,
    followersCount: followersList.length,
  };
};