export interface RecentlyPlayedItem {
  trackId: string;
  title: string;
  artist: string;
  coverArtUrl?: string | null;
  lastPlayedAt: string;
  lastPositionSeconds: number;
}

export interface ListeningHistoryItem {
  trackId: string;
  title: string;
  artist: string;
  coverArtUrl?: string | null;
  playedAt: string;
  positionSeconds: number;
  durationSeconds?: number;
  isCompleted?: boolean;
}