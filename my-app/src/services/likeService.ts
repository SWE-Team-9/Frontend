import api from "./api";
import { TrackData, UserInteractionResponse } from "../types/interactions";
import {
  TrackInteractionNotificationMeta,
  triggerTrackInteractionNotification,
} from "@/src/services/interactionNotificationService";

// Mock data array representing liked tracks for testing pagination
const MOCK_LIKES: TrackData[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `track_${i + 1}`,
  title: `Liked Track ${i + 1}`,
  artistName: `Artist ${i + 1}`,
  coverArt: "",
  coverArtUrl: "", // Added to satisfy TrackData type
  likesCount: Math.floor(Math.random() * 100),
  repostsCount: 0, // Added to satisfy TrackData type
  liked: true,
}));

export interface LikeResponse {
  message: string;
  trackId: string;
  likesCount: number;
  liked: boolean;
}

export const likeTrack = async (
  trackId: string,
  notificationMeta?: TrackInteractionNotificationMeta,
): Promise<LikeResponse> => {
  const response = await api.post(`/interactions/tracks/${trackId}/like`);

  triggerTrackInteractionNotification("like", trackId, notificationMeta);

  return response.data;
};

export const unlikeTrack = async (trackId: string): Promise<LikeResponse> => {
  const response = await api.delete(`/interactions/tracks/${trackId}/like`);
  return response.data;
};

/**
 * Fetches the list of tracks liked by a specific user with pagination support.
 * Supports both Mock data for testing and real API integration.
 * @param userId - The ID of the user whose likes are being fetched.
 * @param page - The current page number for pagination.
 * @param limit - The number of items to fetch per page.
 */
export const getUserLikes = async (userId: string, page = 1, limit = 10): Promise<TrackData[]> => {
  // --- START MOCK LOGIC ---
  // Check if mock mode is enabled via environment variables
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  if (USE_MOCK) {
    // Simulate network latency for a realistic UI experience
    await new Promise((r) => setTimeout(r, 800));

    // Calculate start and end indices based on the requested page and limit
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Return a sliced portion of the mock array to simulate server-side pagination
    return MOCK_LIKES.slice(startIndex, endIndex);
  }
  // --- END MOCK LOGIC ---

  // Pass the page and limit to the API params for server-side pagination
  const response = await api.get<UserInteractionResponse>(`/interactions/users/${userId}/likes`, {
    params: { page, limit }
  });

  if (response.data && response.data.items) {
    return response.data.items.map((item) => {
      const t = item.track;

      const artist = (
        t as TrackData & {
          artist?: {
            id?: string;
            display_name?: string;
            displayName?: string;
            handle?: string;
            avatar_url?: string | null;
            avatarUrl?: string | null;
          };
          artist_name?: string | null;
          artist_name_display?: string | null;
          cover_art_url?: string | null;
          coverUrl?: string | null;
        }
      ).artist;

      const cover =
        t.coverArtUrl ||
        t.coverArt ||
        t.imageUrl ||
        (t as { cover_art_url?: string | null }).cover_art_url ||
        (t as { coverUrl?: string | null }).coverUrl ||
        null;

      return {
        ...t,
        id: t.id,
        trackId: t.trackId ?? t.id,
        title: t.title || "Untitled Track",

        artistName:
          t.artistName ??
          (t as { artist_name?: string | null }).artist_name ??
          (t as { artist_name_display?: string | null }).artist_name_display ??
          artist?.display_name ??
          artist?.displayName ??
          undefined,

        artistId: t.artistId ?? artist?.id,
        artistHandle: t.artistHandle ?? artist?.handle ?? undefined,
        artistAvatarUrl:
          t.artistAvatarUrl ??
          artist?.avatar_url ??
          artist?.avatarUrl ??
          null,

        coverArtUrl: cover,
        coverArt: cover,
        imageUrl: cover,

        waveformData: t.waveformData ?? null,

        interactedAt: item.interactedAt,
        likesCount: t.likesCount ?? 0,
        repostsCount: t.repostsCount ?? 0,
        liked: true,
      } as TrackData;
    });
  }

  return [];
};