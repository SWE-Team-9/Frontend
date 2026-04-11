export interface TrackData {
  id: string;
  trackId?: string; 
  title: string;
  artistName?: string | null;
  likesCount: number;
  repostsCount: number;
  coverArtUrl: string | null;
  coverArt?: string | null; //  for UI compatibility
  imageUrl?: string | null; // for UI compatibility
  slug?: string;
  publishedAt?: string;
}

export interface UserInteractionResponse {
  items: {
    interactedAt: string;
    track: TrackData;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TrackCommentUser {
  id: string;
  display_name: string;
}

export interface TrackComment {
  commentId: string;
  trackId: string;
  text: string;
  timestampSeconds: number;
  createdAt: string;
  user: TrackCommentUser;
}

export interface GetTrackCommentsResponse {
  page: number;
  limit: number;
  total: number;
  comments: TrackComment[];
}

export interface AddTrackCommentBody {
  text: string;
  timestampSeconds: number;
}

export interface AddTrackCommentResponse {
  commentId: string;
  trackId: string;
  text: string;
  timestampSeconds: number;
  createdAt: string;
}