import api from "@/src/services/api";

// ─────────────────────────────────────────────────────────────
// BFF (Backend-for-Frontend) service
//
// Calls the aggregate /app/bootstrap endpoint that returns all
// shell data in one round-trip. Mobile/desktop clients that call
// individual REST endpoints (/auth/me, /profiles, etc.) are
// completely unaffected — this is an additive endpoint.
//
// Security notes:
//   - The endpoint requires a valid JWT cookie (401 if not auth'd)
//   - system_role is fetched fresh from the DB on every call,
//     never from the JWT payload — so role changes take effect
//     immediately on the next page load without requiring re-login
//   - We validate the role against a known whitelist before storing
//     it; anything unexpected is treated as the least-privilege role
//   - Client-side role values are used only for UI gating. All
//     admin API routes enforce @Roles('ADMIN') server-side, so
//     store manipulation cannot grant real access.
// ─────────────────────────────────────────────────────────────

const KNOWN_ROLES = ["ADMIN", "MODERATOR", "USER"] as const;
type SystemRole = (typeof KNOWN_ROLES)[number];

/** Validates the raw role string from the server against the known whitelist. */
export function toSystemRole(raw: string | undefined | null): SystemRole {
  if (raw && (KNOWN_ROLES as readonly string[]).includes(raw)) {
    return raw as SystemRole;
  }
  return "USER";
}

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
