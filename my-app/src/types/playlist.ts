import { Track } from "./track";

export type PlaylistVisibility = "PUBLIC" | "PRIVATE" | "SECRET";

export interface PlaylistOwner {
  id: string;
  display_name: string;
}

export interface Playlist {
  liked: boolean;
  playlistId: string;
  title: string;
  description?: string;
  visibility: PlaylistVisibility;
  cover?: string;
  tracksCount?: number;
  secretToken?: string | null;
  owner?: PlaylistOwner;
  tracks?: Track[];
}

export interface CreatePlaylistInput {
  title: string;
  description?: string;
  visibility: PlaylistVisibility;
  trackIds?: string[];
}

export interface UpdatePlaylistInput {
  title?: string;
  description?: string;
  visibility?: PlaylistVisibility;
}

export interface PlaylistsResponse {
  page: number;
  limit: number;
  total: number;
  playlists: Playlist[];
}