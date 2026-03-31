import { useProfileStore } from "@/src/store/useProfileStore";
import { useState, useEffect, useCallback, useMemo } from "react";
import { socialService } from "@/src/services/socialService";
// import { useParams } from "next/navigation";
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
} from "@/src/services/profileService";

/**
 * Interface representing the UI User structure
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
 * Interface representing the Raw Server/Mock response
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

/**
 * Custom Hook to control profile logic and state management
 * @param targetUserId Optional parameter to fetch a specific user profile
 */
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
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1); 
  const favoriteGenres = store.favoriteGenres;

  // ---- Static data ----
  const tabs = [
    "All",
    "Popular tracks",
    "Tracks",
    "Albums",
    "Playlists",
    "Reposts",
  ];
  const genres = [
    "None",
    "electronic",
    "hip-hop",
    "pop",
    "rock",
    "alternative",
    "ambient",
    "classical",
    "jazz",
    "r-b-soul",
    "metal",
    "folk-singer-songwriter",
    "country",
    "reggaeton",
    "dancehall",
    "drum-bass",
    "house",
    "techno",
    "deep-house",
    "trance",
    "lo-fi",
    "indie",
    "punk",
    "blues",
    "latin",
    "afrobeat",
    "trap",
    "experimental",
    "world",
    "gospel",
    "spoken-word",
  ];

  // ---- Profile links for the share modal ----
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const longLink = store.handle
    ? `${origin}/profile/${store.handle}`
    : `${origin}/profile`;
  const shortLink = longLink;

  /**
   * Fetch profile data from backend on initial load
   */
  const loadProfile = useCallback(async () => {
    if (store.useMockData || store.isLoaded) {
      setIsLoading(false);
      return;
    }
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
        links:
          profile.externalLinks && profile.externalLinks.length > 0
            ? profile.externalLinks.map((l, i) => ({
                id: Date.now() + i,
                platform: l.platform,
                url: l.url,
              }))
            : [{ id: 1, platform: "", url: "" }],
        isLoaded: true,
      });
    } catch {
      console.log("Could not load profile.");
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Save profile updates to the backend
   */
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Copies the profile link to the user's clipboard
   */
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

  const setProfileData = (data: Partial<typeof store>) => {
    store.setProfileData(data);
  };

  // ---- Mock Data for Tracks ----
  const mockTracks = [
    {
      trackId: "trk_123",
      title: "Biomedical Beat",
      artist: { display_name: store.displayName },
      durationSeconds: 215,
      liked: true,
    },
    {
      trackId: "trk_456",
      title: "Next.js Rhythm",
      artist: { display_name: store.displayName },
      durationSeconds: 185,
      liked: false,
    },
  ];

  const displayTracks = store.useMockData ? mockTracks : [];

  // ---- Following List State ----
  const [followingList, setFollowingList] = useState<User[]>([
    {
      id: 1,
      name: "DOJA CAT",
      handle: "dojacat",
      followers: "2M",
      tracks: 164,
      isFollowing: true,
      avatar:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500",
    },
    {
      id: 2,
      name: "Bad-Bunny",
      handle: "badbunny",
      followers: "3M",
      tracks: 168,
      isFollowing: true,
      avatar:
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=500",
    },
    {
      id: 3,
      name: "Travis Scott",
      handle: "travisscott",
      followers: "6.22M",
      tracks: 174,
      isFollowing: true,
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500",
    },
  ]);

  // ---- Followers List State ----
  const [followersList, setFollowersList] = useState<User[]>([
    {
      id: 4,
      name: "The Weeknd",
      handle: "theweeknd",
      followers: "10M",
      tracks: 210,
      isFollowing: false,
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500",
    },
    {
      id: 5,
      name: "Drake",
      handle: "drake",
      followers: "15M",
      tracks: 500,
      isFollowing: false,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=500",
    },
  ]);

  const [suggestedUsers, setSuggestedUsers] = useState([
    {
      id: 301,
      name: "Mazen LoFi",
      reason: "Shared genres",
      isFollowing: false,
      avatar: "",
    },
  ]);

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

  /**
   * Social Graph Integration: Fetches followers and following lists
   * Uses activeId based on URL or session
   */
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching social data for user: ${activeId}`);

        // Fetch parallel data from Service Layer using activeId
        const [followersRes, followingRes] = await Promise.all([
          socialService.getFollowers(activeId),
          socialService.getFollowing(activeId),
        ]);

        /**
         * Maps Server/Mock data structure to the UI User structure
         */
        const mapServerToUI = (serverUsers: ServerUser[]): User[] =>
          serverUsers.map((u) => ({
            // Convert ID to number if string, or keep original
            id: typeof u.id === "string" ? parseInt(u.id) : u.id,
            name: u.display_name || u.name || "Unknown User",
            handle: u.handle || "user",
            // Normalize followers count from various naming conventions
            followers: u.followersCount?.toString() || u.followers?.toString() || "0",
            tracks: u.tracksCount || 0,
            isFollowing: u.isFollowing ?? false,
            avatar:
              u.avatar_url ||
              u.avatar ||
              "https://ui-avatars.com/api/?name=User",
          }));

        if (!store.useMockData) {
          // Update state using the mapped data from mock/server response
          if (followersRes.data && followersRes.data.data) {
            setFollowersList(mapServerToUI(followersRes.data.data));
          }
          if (followingRes.data && followingRes.data.data) {
            setFollowingList(mapServerToUI(followingRes.data.data));
          }
        }
      } catch (err) {
        console.error("API Integration Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [detailTab, activeId, store.useMockData]);

  /**
   * Pagination Simulation: Loads more mock users into the list
   */
  const handleLoadMore = () => {
    console.log(`Loading more data for page: ${currentPage + 1}...`);

    // Create a new mock user instance
    const nextUser: User = {
      id: Date.now(),
      name: "New Mock User",
      handle: `user_${currentPage + 1}`,
      followers: "1K",
      tracks: 10,
      isFollowing: false,
      avatar: "https://ui-avatars.com/api/?name=New+User",
    };

    // Append user based on currently active tab
    if (detailTab === "Following") {
      setFollowingList((prev) => [...prev, nextUser]);
    } else {
      setFollowersList((prev) => [...prev, nextUser]);
    }

    setCurrentPage((prev) => prev + 1);
    alert("Page " + (currentPage + 1) + " loaded successfully (Mock)!");
  };

  /**
   * Memoized display list based on active tab
   */
  const displayUsers = useMemo(() => {
    return detailTab === "Following" ? followingList : followersList;
  }, [detailTab, followingList, followersList]);

  /**
   * Filters the user list based on the search query
   */
  const filteredUsers = useMemo(() => {
    return displayUsers.filter((user: User) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [displayUsers, searchQuery]);

  /**
   * Optimistic update logic for Following/Unfollowing a user
   */
  const toggleFollow = (userId: number) => {
    const toggleInList = <T extends { id: number; isFollowing: boolean }>(
      list: T[],
    ): T[] =>
      list.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user,
      );

    setFollowingList((prev) => toggleInList(prev));
    setFollowersList((prev) => toggleInList(prev));
    setSuggestedUsers((prev) => toggleInList(prev));
    console.log(`Optimistic Update: Toggled user ${userId}`);
  };

  return {
    ...store,
    activeTab,
    setActiveTab,
    setProfileData,
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
  };
};