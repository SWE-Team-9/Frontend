import React, { useState, useEffect } from 'react';
import { trackService } from '../../services/trackService';
import { Track } from '../../types/track';
import { TrackCard } from './TrackCard';
import { DeleteTrackModal } from '../profile/modals/DeleteTrackModal';

interface TrackListProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}

/**
 * TrackList: The main management container for an artist's uploaded audio.
 * It handles the data flow, loading states, and management actions (Edit/Delete).
 */
export const TrackList: React.FC<TrackListProps > = ({ tracks, setTracks }) => {  
  /** * SECTION 1: Local State 
   * Stores the tracks and manages the UI loading state.
   */
  const [isLoading, setIsLoading] = useState(true);

  // 1. Modal control states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<{id: string, title: string} | null>(null);

  /**
   * SECTION 2: Data Loading Logic
   * Integrated with real API call based on Page 4 of the documentation[cite: 64].
   */
  const loadTracks = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data based on real userId [cite: 64]
      const data = await trackService.fetchArtistTracks('usr_123'); 
      
      // setTracks matches the API response structure [cite: 78]
      setTracks(data.tracks); 

    } catch (error) {
      console.error("API Error:", error);
      
      // Fallback to manual mock if API fails during development
      const manualMock: Track[] = [
        { 
          trackId: 'trk_001', 
          title: 'Recording 2026-03-15 1013', 
          status: 'PROCESSING', 
          visibility: 'PUBLIC', 
          artist: { avatarUrl: '' } 
        },
        { 
          trackId: 'trk_002', 
          title: 'Second Track Demo', 
          status: 'FINISHED', 
          visibility: 'PRIVATE', 
          artist: { avatarUrl: '' } 
        }
      ];
      setTracks(manualMock);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial trigger on component mount
   */
  useEffect(() => { 
    loadTracks(); 
  }, []);

  /**
   * SECTION 3: Management Handlers
   */

  // 2. Update delete function to open modal instead of alert
  const handleDeleteClick = (id: string, title: string) => {
    setTrackToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  // 3. Final confirmation function linked to real API [cite: 60]
  const confirmDelete = async () => {
    if (trackToDelete) {
      try {
        // 1. Notify the server first (Page 3 in PDF) [cite: 60]
        await trackService.deleteTrack(trackToDelete.id);
        
        // 2. If successful, remove from UI and update counter
        setTracks(prev => prev.filter(t => t.trackId !== trackToDelete.id));
        
        setIsDeleteModalOpen(false);
        setTrackToDelete(null);
        console.log("Track deleted from server and UI");
      } catch (error) {
        alert("Failed to delete track from server. Please try again.");
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      const updatedTracks = tracks.filter(track => track.trackId !== id);
      setTracks(updatedTracks);
      
      console.log(`Track ${id} deleted locally`);
    }
  };

  const handleEdit = (track: Track) => {
    alert(`Editing: ${track.title}. (This will open Maryam's Form Modal)`);
    
    console.log("Track data to edit:", track);
  };

  /**
   * SECTION 4: Render Logic
   */

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-zinc-400 animate-pulse uppercase tracking-widest text-sm">
          Loading your tracks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header with dynamic track count */}
      <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">
        Manage Your Tracks ({tracks.length})
      </h2>
      
      {/* The List Grid */}
      <div className="grid gap-3">
        {tracks.map(track => (
          <TrackCard 
            key={track.trackId} 
            track={track} 
            onEdit={handleEdit}     
            onDelete={() => handleDeleteClick(track.trackId, track.title)} // Passing name and ID
          />
        ))}
      </div>

      {/* Empty State: Only shown if the array is empty */}
      {tracks.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 italic mb-4">
            No tracks found in your library.
          </p>
        </div>
      )}

      {/* Add the Modal component here at the end of the file */}
      <DeleteTrackModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        trackTitle={trackToDelete?.title || ""}
      />
    </div>
  );
};