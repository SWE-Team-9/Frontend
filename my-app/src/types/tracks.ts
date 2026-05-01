export type TrackStatus = "PROCESSING" | "FINISHED";
export type TrackVisibility = "PUBLIC" | "PRIVATE";

export interface Track {
  trackId: string;
  title: string;
  status: TrackStatus;
  visibility: TrackVisibility;

  genre?: string;
  tags?: string[];
  waveformData?: number[] | null;

  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;

  artist?: string | { displayName?: string };
  artistId?: string | null;
  artistHandle?: string | null;
  artistAvatarUrl?: string | null;

  coverArtUrl?: string | null;
  durationMs?: number;
}

export interface ArtistTracksResponse {
  tracks: Track[];
  totalTracks: number;
  page: number;
  limit: number;
}

