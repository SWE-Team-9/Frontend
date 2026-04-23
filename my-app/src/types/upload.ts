export type TrackStatus = "PROCESSING" | "FINISHED";
export type TrackVisibility = "PUBLIC" | "PRIVATE";

// ============================================================
//  NORMALIZED SHAPES (what the rest of the app uses)
// ============================================================
export interface NormalizedArtist {
  id: string | null;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
}
export interface Track {
  trackId: string;
  title: string;
  status: TrackStatus;
  visibility: TrackVisibility;

  slug?: string | null;
  genre?: string | null;
  tags?: string[];
  waveformData?: number[] | null;

  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;

  artist?: string | { displayName?: string } | null;
  artistId?: string | null;
  artistHandle?: string | null;
  artistAvatarUrl?: string | null;

  artistObj?: NormalizedArtist;

  coverArtUrl?: string | null;
  durationMs?: number | null;
  createdAt?: string | null;
}

export interface TrackDetails extends Track {
  description?: string | null;
  releaseDate?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  accessLevel?: string;
  license?: string;
  allowComments?: boolean;
  downloadable?: boolean;
  secretToken?: string | null;
  files?: TrackFile[];
}

export interface TrackFile {
  id: string;
  role: "ORIGINAL" | "STREAM";
  mimeType: string;
  format: string;
  size: number | null;
  status: "READY" | "PROCESSING";
}

// ============================================================
//  RESPONSE WRAPPERS
// ============================================================

export interface ArtistTracksResponse {
  artist: { userId: string; name: string; avatarUrl: string };
  tracks: Track[];
  totalTracks: number;
  page: number;
  limit: number;
}

export interface UploadResponse {
  trackId: string;
  title: string;
  slug?: string | null;
  artistId: string;
  artistHandle?: string | null;
  status: TrackStatus;
  visibility: TrackVisibility;
  waveformData: number[] | null;
  description: string;
}

// ============================================================
//  RAW BACKEND SHAPES (only used inside the service layer)
// ============================================================
export interface RawTrackDetails {
  trackId: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  artist?: string | null;
  artistId?: string | null;
  artistHandle?: string | null;
  artistAvatarUrl?: string | null;
  genre?: string | null;
  tags?: string[] | null;
  releaseDate?: string | null;
  durationMs?: number | null;
  waveformData?: number[] | null;
  visibility?: TrackVisibility;
  status: TrackStatus;
  accessLevel?: string;
  license?: string;
  allowComments?: boolean;
  downloadable?: boolean;
  coverArtUrl?: string | null;
  secretToken?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  files?: TrackFile[];
}

export interface RawArtistTrack {
  trackId: string;
  title: string;
  slug?: string | null;
  durationMs?: number | null;
  status: TrackStatus;
  visibility?: TrackVisibility;
  coverArtUrl?: string | null;
  createdAt?: string;
  waveformData?: number[] | null;
  genre?: string | null;
  artist?: {
    id?: string | null;
    displayName?: string | null;
    handle?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface RawArtistTracksResponse {
  artist: { userId: string; name: string; avatarUrl: string };
  page: number;
  limit: number;
  totalTracks: number;
  tracks: RawArtistTrack[];
}