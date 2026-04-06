export interface RecentlyPlayedItem {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  liked?: boolean;
  lastPlayedAt: string;
  lastPositionSeconds: number;
}

export interface ListeningHistoryItem {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  playedAt: string;
  positionSeconds: number;
  durationSeconds?: number;
  isCompleted?: boolean;
}