import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface UserProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  accountType: "LISTENER" | "ARTIST";
  favoriteGenres: string[];
  externalLinks: { platform: string; url: string }[];
  followersCount: number;
  followingCount: number;
  tracksCount: number;
}

interface BackendFavoriteGenre {
  slug?: string;
  name?: string;
}

const BACKEND_PLATFORM_TO_UI: Record<string, string> = {
  WEBSITE: "website",
  X: "twitter",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  SPOTIFY: "spotify",
  APPLE_MUSIC: "apple-music",
  BANDCAMP: "bandcamp",
  SOUNDCLOUD: "soundcloud",
  PATREON: "patreon",
  TWITCH: "twitch",
  DISCORD: "discord",
  LINKEDIN: "linkedin",
  GITHUB: "github",
  OTHER: "other",
};

const UI_PLATFORM_TO_BACKEND: Record<string, string> = {
  website: "website",
  twitter: "twitter",
  x: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  youtube: "youtube",
  tiktok: "tiktok",
  spotify: "spotify",
  "apple-music": "apple-music",
  bandcamp: "bandcamp",
  soundcloud: "soundcloud",
  patreon: "patreon",
  twitch: "twitch",
  discord: "discord",
  linkedin: "linkedin",
  github: "github",
};

const normalizePlatformFromBackend = (platform: string): string => {
  const normalized = platform?.trim();
  if (!normalized) return "website";
  return BACKEND_PLATFORM_TO_UI[normalized.toUpperCase()] || normalized.toLowerCase();
};

const normalizePlatformForBackend = (platform: string): string => {
  const normalized = platform?.trim().toLowerCase();
  if (!normalized) return "website";
  return UI_PLATFORM_TO_BACKEND[normalized] || "website";
};

const normalizeUrl = (url: string): string => {
  const value = url.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

interface BackendUserProfile {
  id?: string;
  user_id?: string;
  handle?: string;
  display_name?: string;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  avatar_url?: string | null;
  cover_photo_url?: string | null;
  visibility?: "PUBLIC" | "PRIVATE";
  account_tier?: "LISTENER" | "ARTIST";
  favorite_genres?: string[] | BackendFavoriteGenre[];
  external_links?: Record<string, string>;
  followers_count?: number;
  following_count?: number;
  track_count?: number;
}
// Maps backend profile response to frontend UserProfile structure
const mapProfileResponse = (profile: BackendUserProfile): UserProfile => {
  const favoriteGenresFromBackend = Array.isArray(profile.favorite_genres)
    ? profile.favorite_genres
        .map((g) => {
          if (typeof g === "string") return g;
          return g.slug || g.name || "";
        })
        .filter(Boolean)
    : [];

  return {
    id: profile.id || profile.user_id || "",
    handle: profile.handle || "",
    displayName: profile.display_name ?? "",
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    website: profile.website_url ?? null,
    avatarUrl: profile.avatar_url ?? null,
    coverUrl: profile.cover_photo_url ?? null,
    isPrivate: profile.visibility === "PRIVATE",
    accountType: profile.account_tier ?? "LISTENER",
    favoriteGenres: favoriteGenresFromBackend,
    externalLinks: profile.external_links
      ? Object.entries(profile.external_links).map(([platform, url]) => ({
          platform,
          url,
        }))
      : [],
    followersCount: profile.followers_count ?? 0,
    followingCount: profile.following_count ?? 0,
    tracksCount: profile.track_count ?? 0,
  };
};

// ====== GET my own profile ======
export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/profiles/me");
  return mapProfileResponse(response.data as BackendUserProfile);
};

// ====== GET someone else's profile by handle ======
export const getProfileByHandle = async (handle: string): Promise<UserProfile> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      id: "usr_mock1",
      handle: "test-user",
      displayName: "Test User",
      bio: "Mock user",
      location: "Cairo",
      website: null,
      avatarUrl: null,
      coverUrl: null,
      isPrivate: false,
      accountType: "ARTIST",
      favoriteGenres: [],
      externalLinks: [],
      followersCount: 0,
      followingCount: 0,
      tracksCount: 0,
    };
  }

  const response = await api.get(`/api/v1/profiles/${handle}`);
  return mapProfileResponse(response.data as BackendUserProfile);
};

// ====== UPDATE my profile ======
export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_private?: boolean;
  favorite_genres?: string[];
  account_type?: "LISTENER" | "ARTIST";
}

export const updateMyProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await api.patch("/profiles/me", data);
  return mapProfileResponse(response.data as BackendUserProfile);
};

// ====== UPDATE my social links ======
export interface SocialLink {
  platform: string;
  url: string;
}

export const updateMyLinks = async (links: SocialLink[]) => {
  const payload = links
    .map((link) => ({
      platform: normalizePlatformForBackend(link.platform),
      url: normalizeUrl(link.url),
    }))
    .filter((link) => link.url !== "");

  const response = await api.put("/profiles/me/links", { links: payload });
  return response.data;
};

// ====== CHECK if a handle is available ======
export const checkHandle = async (handle: string) => {
  const response = await api.get("/profiles/check-handle", {
    params: { handle },
  });
  return response.data;
};

// ====== UPLOAD avatar or cover image ======
export const uploadProfileImage = async (
  type: "avatar" | "cover",
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/profiles/me/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
