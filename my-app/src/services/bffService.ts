import api from "@/src/services/api";

// ─────────────────────────────────────────────────────────────
// BFF (Backend-for-Frontend) service
//
// Calls aggregate endpoints that replace clusters of parallel
// API calls previously made by the app shell and page components.
// Old individual APIs are untouched and remain available.
// ─────────────────────────────────────────────────────────────

// ── Bootstrap ────────────────────────────────────────────────

export interface BootstrapMe {
  id: string;
  email: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  account_type: string;
  system_role: string;
  is_verified: boolean;
  subscription_tier: string;
}

export interface BootstrapProfile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  accountType: string;
  followersCount: number;
  followingCount: number;
  tracksCount: number;
}

export interface BootstrapNotifications {
  unreadCount: number;
  latest: unknown[];
}

export interface BootstrapMessages {
  unreadCount: number;
}

export interface BootstrapEntitlements {
  planCode: string;
  isPremium: boolean;
  uploadLimit: number;
  uploadedCount: number;
  remainingUploads: number | null;
  canUpload: boolean;
  adsEnabled: boolean;
  canDownload: boolean;
  supportLevel: string;
  trialEnd: string | null;
}

export interface BootstrapData {
  me: BootstrapMe;
  profile: BootstrapProfile | null;
  notifications: BootstrapNotifications;
  messages: BootstrapMessages;
  player: { session: unknown };
  entitlements: BootstrapEntitlements | null;
  subscription: unknown | null;
}

export async function getBootstrapData(): Promise<BootstrapData> {
  const response = await api.get<BootstrapData>("/app/bootstrap");
  return response.data;
}

// ── Profile page aggregate ────────────────────────────────────

export interface ProfilePageRelationship {
  isFollowing: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
  canMessage: boolean;
}

export interface ProfilePageTracks {
  items: unknown[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ProfilePageCounts {
  followers: number;
  following: number;
  tracks: number;
}

export interface ProfilePageViewerInteractions {
  likedTrackIds: string[];
  repostedTrackIds: string[];
}

export interface ProfilePagePermissions {
  canEditProfile: boolean;
  canViewPrivateTracks: boolean;
}

export interface ProfilePageData {
  viewer: unknown | null;
  profile: unknown;
  relationship: ProfilePageRelationship | null;
  tracks: ProfilePageTracks;
  counts: ProfilePageCounts;
  viewerInteractions: ProfilePageViewerInteractions | null;
  permissions: ProfilePagePermissions;
}

export async function getProfilePageData(
  handle: string,
  page = 1,
  limit = 10,
): Promise<ProfilePageData> {
  const response = await api.get<ProfilePageData>(`/pages/profile/${handle}`, {
    params: { page, limit },
  });
  return response.data;
}

// ── Settings page aggregate ───────────────────────────────────

export interface SettingsPageData {
  me: BootstrapMe;
  profile: unknown | null;
  subscription: unknown | null;
  entitlements: BootstrapEntitlements | null;
  notificationPreferences: unknown | null;
  sessionsSummary: { count: number };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const response = await api.get<SettingsPageData>("/pages/settings");
  return response.data;
}
