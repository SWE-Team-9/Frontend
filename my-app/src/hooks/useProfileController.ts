import { useProfileStore } from "@/src/store/useProfileStore";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { socialService } from "@/src/services/socialService";
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
  uploadProfileImage,
} from "@/src/services/profileService";

/**
 * UI User structure for consistency
 */
interface User {
  id: number;
  name: string;
  handle: string;
  followers: string;
  tracks: number;
  isFollowing: boolean;
  avatar: string;
}

/**
 * Raw Server/Mock response mapping
 */
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

  // Determine Active ID: Use targetUserId from URL or fallback to store handle/default
  const activeId = targetUserId || store.handle || "me";

  // ---- UI state ----
  const [activeTab, setActiveTab] = useState("All");
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

  // ---- Dynamic Data Lists ----
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [likesList, setLikesList] = useState<any[]>([]);

  const tabs = ["All", "Popular tracks", "Tracks", "Albums", "Playlists", "Reposts"];
  const genres = ["None", "electronic", "hip-hop", "pop", "rock", "alternative", "ambient", "classical", "jazz", "r-b-soul", "metal", "folk-singer-songwriter", "country", "reggaeton", "dancehall", "drum-bass", "house", "techno", "deep-house", "trance", "lo-fi", "indie", "punk", "blues", "latin", "afrobeat", "trap", "experimental", "world", "gospel", "spoken-word"];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const longLink = store.handle ? `${origin}/profile/${store.handle}` : `${origin}/profile`;
  const shortLink = longLink;

  /**
   * Load Profile Data
   */
  const loadProfile = useCallback(async () => {
    if (store.isLoaded || hasRequestedProfileRef.current) return;
    hasRequestedProfileRef.current = true;

    try {
      setIsLoading(true);
      const profile = await getMyProfile();

      store.setProfileData({
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
        links: profile.externalLinks && profile.externalLinks.length > 0
          ? profile.externalLinks.map((l: any, i: number) => ({
              id: Date.now() + i,
              platform: l.platform,
              url: l.url,
            }))
          : [{ id: 1, platform: "", url: "" }],
        isLoaded: true,
      });
    } catch (err) {
      hasRequestedProfileRef.current = false;
      console.log("Profile load failed or user not logged in.");
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Fetch Social Data (Followers/Following)
   */
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
            id: typeof u.id === "string" ? parseInt(u.id) : (u.id as number),
            name: u.display_name || u.name || "Unknown User",
            handle: u.handle || "user",
            followers: u.followersCount?.toString() || u.followers?.toString() || "0",
            tracks: u.tracksCount || 0,
            isFollowing: u.isFollowing ?? false,
            avatar: u.avatar_url || u.avatar || "https://ui-avatars.com/api/?name=User",
          }));

        if (followersRes.data?.data) setFollowersList(mapServerToUI(followersRes.data.data));
        if (followingRes.data?.data) setFollowingList(mapServerToUI(followingRes.data.data));
      } catch (err) {
        console.error("Social Graph Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [activeId, detailTab]);

  /**
   * Save Profile Updates
   */
  const handleSave = async () => {
    if (!store.displayName.trim()) {
      setError("Display name is required!");
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle Avatar Upload (Fixed Return Type & Error Handling)
   */
  const handleAvatarUpload = async (file: File): Promise<string | undefined> => {
    if (isAvatarUploading) return store.avatarUrl || undefined;
    try {
      setIsAvatarUploading(true);
      setError("");
      const result = (await uploadProfileImage("avatar", file)) as { url?: string };
      const uploadedUrl = result?.url || undefined;

      if (uploadedUrl) {
        store.setProfileData({ avatarUrl: uploadedUrl });
      }
      return uploadedUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload avatar.");
      return undefined; 
    } finally {
      setIsAvatarUploading(false);
    }
  };

  /**
   * Toggle Follow (Fixed String Conversion for Service)
   */
  const toggleFollow = async (userId: number) => {
    const allUsers = [...followersList, ...followingList, ...suggestedUsers];
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextFollowingState = !targetUser.isFollowing;

    // Optimistic UI Update
    store.setProfileData({
      followingCount: nextFollowingState ? store.followingCount + 1 : Math.max(0, store.followingCount - 1),
    });

    const update = (list: any[]) => list.map(u => u.id === userId ? { ...u, isFollowing: nextFollowingState } : u);
    setFollowersList(prev => update(prev));
    setSuggestedUsers(prev => update(prev));

    try {
      if (nextFollowingState) {
        setFollowingList(prev => [...prev, { ...targetUser, isFollowing: true }]);
        // Fixed: Converting number ID to string for the service
        await socialService.followUser(String(userId));
      } else {
        setFollowingList(prev => prev.filter(u => u.id !== userId));
        // Fixed: Converting number ID to string for the service
        await socialService.unfollowUser(String(userId));
      }
    } catch (err) {
      console.error("Toggle Follow Error:", err);
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = isShortened ? shortLink : longLink;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const displayUsers = useMemo(() => (detailTab === "Following" ? followingList : followersList), [detailTab, followingList, followersList]);

  const filteredUsers = useMemo(() => {
    return displayUsers.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [displayUsers, searchQuery]);

  return {
    ...store,
    activeTab,
    setActiveTab,
    setProfileData: (data: Partial<typeof store>) => store.setProfileData(data),
    tabs,
    viewState,
    setViewState,
    detailTab,
    setDetailTab,
    isEditOpen,
    setIsEditOpen,
    isShareOpen,
    setIsShareOpen,
    shareTab,
    setShareTab,
    isShortened,
    setIsShortened,
    copied,
    copyToClipboard,
    error,
    handleSave,
    genres,
    showSuccessToast,
    longLink,
    shortLink,
    isSaving,
    isLoading,
    isAvatarUploading,
    handleAvatarUpload,
    displayTracks: [], 
    toggleFollow,
    likesList,
    setLikesList,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    displayUsers,
    favoriteGenres,
    suggestedUsers,
    handleLoadMore: () => setCurrentPage(prev => prev + 1),
    currentPage,
  };
};