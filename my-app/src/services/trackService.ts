import api from './api'; 
import { Track, ArtistTracksResponse } from '../types/track';

/**
 * Service to handle all track-related API interactions for Module 4.
 * This includes fetching, updating, and deleting audio tracks.
 */
export const trackService = {
  
  /**
   * Retrieves a paginated list of tracks for a specific artist.
   * @param userId - The unique ID of the artist (user).
   * @param page - Current page number (default is 1)
   * @param limit - Number of tracks per page (default is 20).
   * @returns A promise resolving to the list of tracks and pagination metadata .
   */
  fetchArtistTracks: async (userId: string, page = 1, limit = 20): Promise<ArtistTracksResponse> => {
    const response = await api.get(`/api/v1/users/${userId}/tracks`, {
      params: { page, limit } 
    });
    return response.data;
  },

  /**
   * Updates the metadata for an existing track.
   * @param trackId - The ID of the track to be updated.
   * @param data - The new metadata including title, genre, and tags .
   * @returns A promise resolving to the updated track details.
   */
  updateTrack: async (trackId: string, data: { title: string; genre: string; tags: string[] }) => {
    const response = await api.put(`/api/v1/tracks/${trackId}`, data); 
    return response.data;
  },

  /**
   * Permanently deletes a track from the system.
   * Only allowed if the artist owns the track.
   * @param trackId - The ID of the track to be deleted.
   * @returns A promise that resolves when the deletion is successful (204 No Content).
   */
  deleteTrack: async (trackId: string) => {
    await api.delete(`/api/v1/tracks/${trackId}`); 
  }
};