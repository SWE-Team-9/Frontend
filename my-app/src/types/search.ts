export interface SearchUser {
  id: string;
  display_name: string;
  handle?: string;
  avatar_url?: string;
}

export interface SearchTrack {
  id: string;
  title: string;
  genre?: string;
  artwork_url?: string;
  artist_handle?: string;
}

export interface SearchPlaylist {
  id: string;
  title: string;
  cover_url?: string;
}

export interface SearchMeta {
  current_page: number;
  total_results: number;
  total_pages: number;
}

export interface SearchResponse {
  data: {
    users: SearchUser[];
    tracks: SearchTrack[];
    playlists: SearchPlaylist[];
  };
  meta: SearchMeta;
}

export type SearchType = "all" | "users" | "tracks" | "playlists";