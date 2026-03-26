import { useProfileStore } from "@/src/store/useProfileStore";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMyProfile,
  updateMyProfile,
  updateMyLinks,
  uploadProfileImage,
} from "@/src/services/profileService";

// ─────────────────────────────────────────────────────────────
// useProfileController
//
// This hook is the "brain" of the profile page. It:
//   1. Fetches the user's profile from the backend on first load
//   2. Provides all the UI state (which tab is active, modals, etc.)
//   3. Saves changes back to the backend when the user clicks Save
//
// BEGINNER TIP:
//   A "controller" hook keeps UI logic out of the page component
//   so the page only deals with displaying things.
// ─────────────────────────────────────────────────────────────

type AccountType = "ARTIST" | "LISTENER";

export const useProfileController = () => {
  const store = useProfileStore();

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

  // ---- Static data ----
  const tabs = ["All", "Popular tracks", "Tracks", "Albums", "Playlists", "Reposts"];
  // These values MUST match the backend's ALLOWED_GENRES list exactly (lowercase, with dashes)
  const genres = [
    "None",
    "electronic", "hip-hop", "pop", "rock", "alternative",
    "ambient", "classical", "jazz", "r-b-soul", "metal",
    "folk-singer-songwriter", "country", "reggaeton", "dancehall",
    "drum-bass", "house", "techno", "deep-house", "trance",
    "lo-fi", "indie", "punk", "blues", "latin",
    "afrobeat", "trap", "experimental", "world", "gospel", "spoken-word",
  ];

  // ---- Profile links for the share modal ----
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const longLink = store.handle
    ? `${origin}/profile/${store.handle}`
    : `${origin}/profile`;
  const shortLink = longLink; // no shortener yet

  // ──────────────────────────────────────────
  //  FETCH profile from backend on first load
  // ──────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (store.isLoaded || hasRequestedProfileRef.current) return; // already loaded or already requested
    hasRequestedProfileRef.current = true;

    try {
      setIsLoading(true);
      const profile = await getMyProfile();

      // Convert the backend response into our store shape
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
        // Convert backend links → our local links (add an id for React keys)
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
      // If the profile fetch fails (not logged in, etc.), just ignore
      hasRequestedProfileRef.current = false;
      console.log("Could not load profile — user may not be logged in.");
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ──────────────────────────────
  //  SAVE changes to the backend
  // ──────────────────────────────
  const handleSave = async () => {
    // Simple validation
    if (!store.displayName.trim()) {
      setError("Display name is required!");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      // 1. Update basic profile fields
      await updateMyProfile({
        display_name: store.displayName,
        bio: store.bio || undefined,
        location: store.location || undefined,
        website: store.website || undefined,
        is_private: store.isPrivate,
        favorite_genres: store.favoriteGenres.filter((g) => g !== "None"),
        account_type: store.accountType,
      });

      // 2. Update social links (skip empty ones)
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

  const handleAvatarUpload = async (file: File): Promise<string | undefined> => {
    if (isAvatarUploading) return store.avatarUrl || undefined;

    try {
      setIsAvatarUploading(true);
      setError("");

      const result = await uploadProfileImage("avatar", file);
      const uploadedUrl =
        (result as { url?: string | null })?.url || undefined;

      if (uploadedUrl) {
        store.setProfileData({ avatarUrl: uploadedUrl });
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

  // ---- Clipboard helper ----
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

  // ---- setProfileData wrapper ----
  const setProfileData = (data: Partial<typeof store>) => {
    store.setProfileData(data);
  };

  // ---- Return everything the page needs ----
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
    isAvatarUploading,
    handleAvatarUpload,
  };
};