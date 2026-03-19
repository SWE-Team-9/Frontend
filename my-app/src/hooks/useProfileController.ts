import { useProfileStore } from '@/src/store/useProfileStore';
import { useState } from 'react';

// Manages UI logic, form validation, and acts as a bridge between the Store (Model) and the Page (View).
type AccountTier = "Artist" | "Listener" | undefined;

export const useProfileController = () => {
  // Access global state from the Zustand store
  const store = useProfileStore();
  
  // 1. UI Control States
  const [activeTab, setActiveTab] = useState("All");
  // Controls current view (e.g., main profile vs. details page)
  const [viewState, setViewState] = useState("profile"); 
  const [detailTab, setDetailTab] = useState("Following");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState("Share"); 
  const [isShortened, setIsShortened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [accountTier, setAccountTier] = useState<AccountTier>(store.accountTier); 

  // 2. Static Data
  const tabs = ["All", "Popular tracks", "Tracks", "Albums", "Playlists", "Reposts"];
  const longLink = "https://soundcloud.com/gehad-mourad-904565429";
  const shortLink = "https://on.soundcloud.com/8LKK3k9RQB5hmgoZ3W";
  
  // List of required music genres as per Sprint requirements
  const genres = ["None", "Rock", "Pop", "Hip Hop", "Jazz", "Electronic"];

  // 3. Logic Methods
// Validates mandatory fields and saves changes, then triggers success feedback.
  const handleSave = () => {
    // Validation Logic: Ensure required fields are not empty
    if (store.displayName.trim() === "") {
      setError("Display name is required!");
      return;
    }
    if (store.country.trim() === "") {
      setError("Country is required!");
      return;
    }
    if (store.bio.trim() === "") {
      setError("Bio cannot be empty!");
      return;
    }
    
    setError("");
    setIsEditOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

// Copies the chosen profile link (long or shortened) to the user's clipboard.
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

  const setProfileData = (data: Partial<typeof store & { accountTier?: AccountTier }>) => {
  if (data.accountTier) {
    if (data.accountTier === "Artist" || data.accountTier === "Listener") {
      setAccountTier(data.accountTier);
    }
  }
  Object.keys(data).forEach((key) => {
    if (key !== "accountTier" && key in store) {
      (store as any)[key] = (data as any)[key];
    }
  });
};

  // 4. Return Everything to View
  return {
    ...store, // Spread Model data and Store Actions
    activeTab, 
    accountTier, 
    setProfileData, 
    setActiveTab, 
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
    shortLink
  };
};