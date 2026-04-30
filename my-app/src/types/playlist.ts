export interface PlaylistTrack {
  trackId: string;
  title: string;
}

export interface PlaylistOwner {
  id?: string;
  display_name: string;
}

export interface Playlist {
  liked?: boolean; 
  playlistId: string;
  title: string;
  description?: string | null;
  visibility: "PUBLIC" | "SECRET" | "PRIVATE";
  tracksCount?: number;
  cover?: string | null;
  secretToken?: string | null;
  owner?: PlaylistOwner;
  tracks?: PlaylistTrack[];
  slug?: string;
  type?: string | null;
  releaseDate?: string | null;
  genreId?: number | null;
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
  visibility?: "PUBLIC" | "SECRET";
  type?: string;
  releaseDate?: string;
  genreId?: number | null;
  tags?: string[];
}