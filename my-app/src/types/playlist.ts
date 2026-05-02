export interface PlaylistOwner {
  id?: string;
  display_name?: string;
  displayName?: string;
  handle?: string | null;
}

export interface PlaylistTrackArtist {
  id: string;
  name: string;
  handle: string | null;
}

export interface PlaylistTrack {
  trackId: string;
  title: string;
  coverArtUrl?: string | null;
  durationMs?: number | null;
  likesCount?: number;
  repostsCount?: number;
  artist?: PlaylistTrackArtist;
}

export interface Playlist {
  liked?: boolean;
  likesCount?: number;
  playlistId: string;
  title: string;
  description?: string | null;
  visibility: "PUBLIC" | "SECRET";
  tracksCount?: number;
  cover?: string | null;
  secretToken?: string | null;
  owner?: PlaylistOwner;
  tracks?: PlaylistTrack[];
  slug?: string;
  type?: string | null;
  releaseDate?: string | null;
  genre?: string | null;
  tags?: string[];
}

export interface CreatePlaylistInput {
  title: string;
  description?: string;
  visibility: "PUBLIC" | "SECRET";
  trackIds?: string[];
}

export interface UpdatePlaylistInput {
  title?: string;
  description?: string;
  visibility?: "public" | "secret";
  type?: string;
  releaseDate?: string;
  genre?: string | null;
  tags?: string[];
}