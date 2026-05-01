import api from "./api";
import { FollowUser } from "@/src/services/followService";
import {
  TrackInteractionNotificationMeta,
  triggerTrackInteractionNotification,
} from "@/src/services/interactionNotificationService";
import type {
  GetTrackCommentsResponse,
  AddTrackCommentBody,
  AddTrackCommentResponse,
} from "@/src/types/interactions";

// ─── Internal backend shapes ──────────────────────────────────────────────────

interface BackendUser {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  handle?: string;
}

interface InteractionItem {
  interactedAt: string;
  user: BackendUser;
}

// ─── Engagements (Likes / Reposts) ────────────────────────────────────────────

export interface PaginatedEngagements {
  items: FollowUser[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch users who liked or reposted a track.
 * Supports pagination via page + limit.
 * Used by EngagementModal and TrackActionButtons.
 */
export const getTrackEngagements = async (
  trackId: string,
  type: "likes" | "reposts",
  page = 1,
  limit = 20,
): Promise<PaginatedEngagements> => {
  const endpoint = type === "likes" ? "likers" : "reposters";

  const response = await api.get(
    `/interactions/tracks/${trackId}/${endpoint}`,
    { params: { page, limit } },
  );

  const rawItems: InteractionItem[] = response.data.items || [];
  const total: number =
    response.data.total ??
    response.data.pagination?.total ??
    rawItems.length;

  return {
    items: rawItems.map((item) => ({
      id: item.user.userId,
      display_name: item.user.displayName,
      handle:
        item.user.handle ||
        item.user.displayName.toLowerCase().replace(/\s+/g, ""),
      avatar_url: item.user.avatarUrl || "",
    })),
    total,
    hasMore: page * limit < total,
  };
};

// ─── Comments ─────────────────────────────────────────────────────────────────

interface BackendTrackComment {
  id?: string;
  commentId?: string;
  comment_id?: string;
  trackId?: string;
  track_id?: string;
  text?: string;
  content?: string;
  timestampSeconds?: number;
  timestamp_seconds?: number;
  timestampAt?: number;
  timestamp_at?: number;
  createdAt?: string;
  created_at?: string;
  user: {
    id?: string;
    userId?: string;
    user_id?: string;
    display_name?: string;
    displayName?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
  };
}

type BackendGetTrackCommentsResponse =
  | BackendTrackComment[]
  | {
    page?: number;
    limit?: number;
    total?: number;
    comments?: BackendTrackComment[];
  };

/**
 * Fetch timestamped comments for a track.
 */
export async function getTrackComments(
  trackId: string,
  page = 1,
  limit = 100,
): Promise<GetTrackCommentsResponse> {
  const { data } = await api.get<BackendGetTrackCommentsResponse>(
    `/interactions/tracks/${trackId}/comments?page=${page}&limit=${limit}`,
  );

  const rawComments = Array.isArray(data) ? data : (data.comments ?? []);

  return {
    page: Array.isArray(data) ? page : (data.page ?? page),
    limit: Array.isArray(data) ? limit : (data.limit ?? limit),
    total: Array.isArray(data)
      ? rawComments.length
      : (data.total ?? rawComments.length),
    comments: rawComments.map((comment) => ({
      commentId: comment.commentId ?? comment.comment_id ?? comment.id ?? "",
      trackId: comment.trackId ?? comment.track_id ?? trackId,
      text: comment.text ?? comment.content ?? "",
      timestampSeconds:
        comment.timestampSeconds ??
        comment.timestamp_seconds ??
        comment.timestampAt ??
        comment.timestamp_at ??
        0,
      createdAt:
        comment.createdAt ??
        comment.created_at ??
        "",
      user: {
        id:
          comment.user.id ??
          comment.user.userId ??
          comment.user.user_id ??
          "",
        display_name:
          comment.user.display_name ??
          comment.user.displayName ??
          "Unknown User",
        avatarUrl:
          comment.user.avatarUrl ??
          comment.user.avatar_url ??
          null,
      },
    })),
  };
}

/**
 * Post a new timestamped comment on a track.
 */
export async function addTrackComment(
  trackId: string,
  body: AddTrackCommentBody,
  notificationMeta?: TrackInteractionNotificationMeta,
): Promise<AddTrackCommentResponse> {
  const payload = {
    content: body.content,
    timestampAt: body.timestampAt,
  };

  const { data } = await api.post<AddTrackCommentResponse>(
    `/interactions/tracks/${trackId}/comments`,
    payload,
  );

  triggerTrackInteractionNotification("comment", trackId, notificationMeta);

  return data;
}

/**
 * Delete a comment by its ID.
 */
export async function deleteTrackComment(
  commentId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete(`/interactions/comments/${commentId}`);
  return data;
}