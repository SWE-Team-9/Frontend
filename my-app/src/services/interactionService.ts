import api from "./api";
import { FollowUser } from "@/src/services/followService";
import type {
  TrackComment,
  GetTrackCommentsResponse,
  AddTrackCommentBody,
  AddTrackCommentResponse,
} from "@/src/types/interactions";

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

export const getTrackEngagements = async (
  trackId: string,
  type: "likes" | "reposts"
): Promise<FollowUser[]> => {
  const endpoint = type === "likes" ? "likers" : "reposters";

  const response = await api.get(`/interactions/tracks/${trackId}/${endpoint}`);
  const items = response.data.items || [];

  return items.map((item: InteractionItem) => ({
    id: item.user.userId,
    display_name: item.user.displayName,
    handle:
      item.user.handle ||
      item.user.displayName.toLowerCase().replace(/\s+/g, ""),
    avatar_url: item.user.avatarUrl || "",
  }));
};

// ===============================
// COMMENTS
// ===============================

interface BackendTrackComment {
  commentId: string;
  text: string;
  timestampSeconds: number;
  createdAt: string;
  user: {
    id: string;
    display_name: string;
  };
}

interface BackendGetTrackCommentsResponse {
  page: number;
  limit: number;
  total: number;
  comments: BackendTrackComment[];
}

export async function getTrackComments(
  trackId: string,
  page = 1,
  limit = 100
): Promise<GetTrackCommentsResponse> {
  const { data } = await api.get<BackendGetTrackCommentsResponse>(
    `/interactions/tracks/${trackId}/comments?page=${page}&limit=${limit}`
  );

  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    comments: data.comments.map((comment) => ({
      commentId: comment.commentId,
      trackId,
      text: comment.text,
      timestampSeconds: comment.timestampSeconds,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        display_name: comment.user.display_name,
      },
    })),
  };
}

export async function addTrackComment(
  trackId: string,
  body: AddTrackCommentBody
): Promise<AddTrackCommentResponse> {
  const { data } = await api.post<AddTrackCommentResponse>(
    `/interactions/tracks/${trackId}/comments`,
    body
  );

  return data;
}

export async function deleteTrackComment(commentId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/interactions/comments/${commentId}`);
  return data;
}