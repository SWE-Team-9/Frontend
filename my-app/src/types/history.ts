export interface RecentlyPlayedItem {
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
  durationMs?: number;
  durationSeconds?: number;
  waveformData?: number[] | null;
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
  durationMs?: number;
  durationSeconds?: number;
  waveformData?: number[] | null;
  playedAt: string;
  positionSeconds: number;
  isCompleted?: boolean;
}