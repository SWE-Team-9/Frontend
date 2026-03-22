import api from "@/src/services/api";

// ─────────────────────────────────────────────────────────────
// Profile Service
//
// All API calls related to user profiles. The backend endpoints
// live at /api/v1/profiles/* — but since our axios baseURL
// already includes /api/v1, we just write /profiles/...
//
// BEGINNER TIP:
//   Every function here returns a Promise. You call them with
//   `await` inside a try/catch block so you can handle errors.
// ─────────────────────────────────────────────────────────────

// ====== Types that match the backend response ======

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

// ====== GET my own profile ======
export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/profiles/me");
  return response.data;
};

// ====== GET someone else's profile by handle ======
export const getProfileByHandle = async (handle: string): Promise<UserProfile> => {
  const response = await api.get(`/profiles/${handle}`);
  return response.data;
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
  return response.data;
};

// ====== UPDATE my social links ======
export interface SocialLink {
  platform: string;
  url: string;
}

export const updateMyLinks = async (links: SocialLink[]) => {
  const response = await api.put("/profiles/me/links", { links });
  return response.data;
};

// ====== CHECK if a handle is available ======
export const checkHandle = async (handle: string) => {
  const response = await api.get("/profiles/check-handle", {
    params: { handle },
  });
  return response.data; // { available: boolean, handle, reason? }
};

// ====== UPLOAD avatar or cover image ======
export const uploadProfileImage = async (
  type: "avatar" | "cover",
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/profiles/me/images/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { url, key }
};
