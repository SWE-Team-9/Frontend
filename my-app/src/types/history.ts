export interface RecentlyPlayedItem {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  liked?: boolean;
  likesCount?: number;
  reposted?: boolean;
  repostsCount?: number;
  lastPlayedAt: string;
  lastPositionSeconds: number;
}

export interface ListeningHistoryItem {
  trackId: string;
  title: string;
  slug?: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  coverArtUrl?: string | null;
  liked?: boolean;
  likesCount?: number;
  reposted?: boolean;
  repostsCount?: number;
  playedAt: string;
  positionSeconds: number;
  durationSeconds?: number;
  isCompleted?: boolean;
}