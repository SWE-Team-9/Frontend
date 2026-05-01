export interface Track {
  trackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
  genre?: string;
  plays?: number;
}