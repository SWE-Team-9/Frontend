export type TrackStatus = 'PROCESSING' | 'FINISHED';

export type TrackVisibility = 'PUBLIC' | 'PRIVATE';

export interface Track {
  trackId: string; 
  title: string; 
  status: TrackStatus; 
  visibility: string; 
  genre?: string;
  tags?: string[]; 
  artist?: {
    avatarUrl: string; 
  };
  waveformData?: number[] | null; 

  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;
}
export interface ArtistTracksResponse {
  tracks: Track[]; 
  totalTracks: number; 
  page: number;
  limit: number; 
}