/**
 * Defines the possible processing states of an audio track
 * PROCESSING: Track is being transcoded or analyzed 
 * FINISHED: Track is ready for playback and waveform display 
 */

export type TrackStatus = 'PROCESSING' | 'FINISHED';
/**
 * Defines who can access the track
 * PUBLIC: Visible to everyone 
 * PRIVATE: Only accessible by the artist or via secret token 
 */
export type TrackVisibility = 'PUBLIC' | 'PRIVATE';
/**
 * Represents the core data structure for an audio track
 */
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
}


/**
 * Standard response format for fetching multiple tracks with pagination
 */
export interface ArtistTracksResponse {
  tracks: Track[]; 
  totalTracks: number; 
  page: number;
  limit: number; 
}