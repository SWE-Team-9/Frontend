/* eslint-disable react-hooks/exhaustive-deps */
import { useProfileStore } from "@/src/store/useProfileStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
  uploadProfileImage,
  getProfileByHandle,
} from "@/src/services/profileService";

type AccountType = "ARTIST" | "LISTENER";

type ProfileDraft = {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  isPrivate?: boolean;
  favoriteGenres: string[];
  accountType: AccountType;
  links?: {
    id: number;
    platform: string;
    url: string;
  }[];
};

export const useProfileController = (handle?: string) => {
  const store = useProfileStore();
  
  const [userId, setUserId] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);  
  const isOwner = userId === currentUserId;
  const [activeTab, setActiveTab] = useState("Tracks");
  const [viewState, setViewState] = useState("profile");
  const [detailTab, setDetailTab] = useState("Following");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const hasRequestedProfileRef = useRef(false);

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
    "quran",
    "sha3by",
    "islamic",
  ];

  const loadProfile = useCallback(async () => {
    if (hasRequestedProfileRef.current) return;
    hasRequestedProfileRef.current = true;

    try {
      setIsLoading(true);
      const profile = handle
        ? await getProfileByHandle(handle)
        : await getMyProfile();
      setUserId(profile.id);

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
        links:
          profile.externalLinks && profile.externalLinks.length > 0
            ? profile.externalLinks.map(
                (l: { platform: string; url: string }, i: number) => ({
                  id: Date.now() + i,
                  platform: l.platform,
                  url: l.url,
                }),
              )
            : [{ id: 1, platform: "", url: "" }],
        isLoaded: true,
      });

      // Sync avatar to auth store so the navbar always shows the correct photo
      if (!handle) {
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          useAuthStore.getState().setUser({
            ...authUser,
            avatarUrl: profile.avatarUrl ?? null,
          });
        }
      }
    } catch {
      hasRequestedProfileRef.current = false;
      setError("Could not load profile. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    const current = useProfileStore.getState();
    if (current.handle === handle && current.isLoaded) {
      hasRequestedProfileRef.current = true;
      return;
    }
    setIsLoading(true); 
    setUserId(null);
    store.resetProfile();
    hasRequestedProfileRef.current = false;
    loadProfile();
  }, [handle]);

const handleSave = async (draft: ProfileDraft) => {
  const nextProfile = {
    displayName: draft.displayName,
    bio: draft.bio,
    location: draft.location,
    website: draft.website,
    isPrivate: draft.isPrivate,
    favoriteGenres: draft.favoriteGenres,
    accountType: draft.accountType,
    links: draft.links ?? [],
  };

  if (!nextProfile.displayName.trim()) {
    setError("Display name is required!");
    return;
  }

  try {
    setIsSaving(true);
    setError("");

    await updateMyProfile({
      display_name: nextProfile.displayName,
      bio: nextProfile.bio || undefined,
      location: nextProfile.location || undefined,
      website: nextProfile.website || undefined,
      is_private: nextProfile.isPrivate,
      favorite_genres: nextProfile.favoriteGenres.filter((g) => g !== "None"),
      account_type: nextProfile.accountType,
    });

    const validLinks = nextProfile.links
      .filter((l) => l.url.trim() !== "")
      .map((l) => ({ platform: l.platform || "website", url: l.url }));

    await updateMyLinks(validLinks);

    store.setProfileData(nextProfile);

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

  const handleAvatarUpload = async (file: File): Promise<string | undefined> => {
    if (isAvatarUploading) return store.avatarUrl || undefined;

    try {
      setIsAvatarUploading(true);
      setError("");

      const result = await uploadProfileImage("avatar", file);
      const uploadedUrl = (result as { url?: string | null })?.url || undefined;

      if (uploadedUrl) {
        store.setProfileData({ avatarUrl: uploadedUrl });

        // Keep navbar in sync after avatar upload
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          useAuthStore.getState().setUser({ ...authUser, avatarUrl: uploadedUrl });
        }
      }

      return uploadedUrl;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to upload avatar.");
      throw err;
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleCoverUpload = async (file: File): Promise<string | undefined> => {
    if (isCoverUploading) return store.coverUrl || undefined;

    try {
      setIsCoverUploading(true);
      setError("");

      const result = await uploadProfileImage("cover", file);
      const uploadedUrl = (result as { url?: string | null })?.url || undefined;

      if (uploadedUrl) {
        store.setProfileData({ coverUrl: uploadedUrl });
      }

      return uploadedUrl;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to upload cover photo.");
      throw err;
    } finally {
      setIsCoverUploading(false);
    }
  };

  const setProfileData = (data: Parameters<typeof store.setProfileData>[0]) => {
    store.setProfileData(data);
  };

  return {
    ...store,
    userId,
    isOwner,
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
    error,
    handleSave,
    genres,
    showSuccessToast,
    isSaving,
    isLoading,
    isAvatarUploading,
    isCoverUploading,
    handleAvatarUpload,
    handleCoverUpload,
  };
};