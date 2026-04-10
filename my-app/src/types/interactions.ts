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