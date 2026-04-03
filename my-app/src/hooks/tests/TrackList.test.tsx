import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import { TrackList } from '../../components/tracks/TrackList';
import { trackService } from '../../services/trackService';
import { Track } from '../../types/track';

jest.mock('../../services/trackService');

const mockTracks: Track[] = [
  { 
    trackId: 'trk_001', 
    title: 'Test Track Finished', 
    status: 'FINISHED', 
    visibility: 'PUBLIC',
    artist: { avatarUrl: '' }
  },
  { 
    trackId: 'trk_002', 
    title: 'Test Track Processing', 
    status: 'PROCESSING', 
    visibility: 'PRIVATE',
    artist: { avatarUrl: '' }
  }
];

describe('TrackList Component Management', () => {
  
  beforeEach(() => {
    (trackService.fetchArtistTracks as jest.Mock).mockResolvedValue({
      tracks: mockTracks,
      totalTracks: 2
    });
  });

  it('should show loading pulse initially', () => {
    render(<TrackList tracks={[]} setTracks={() => {}} />);
    expect(screen.getByText(/Loading your tracks/i)).toBeInTheDocument();
  });

  it('should render track titles after loading', async () => {
    render(<TrackList tracks={mockTracks} setTracks={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Track Finished')).toBeInTheDocument();
      expect(screen.getByText('Test Track Processing')).toBeInTheDocument();
    });
  });

  it('should show processing message only for processing tracks', async () => {
    render(<TrackList tracks={mockTracks} setTracks={() => {}} />);
    expect(screen.getByText(/Track is being processed/i)).toBeInTheDocument();
  });

  it('should open delete modal when delete button is clicked', async () => {
    render(<TrackList tracks={mockTracks} setTracks={() => {}} />);
    
    const deleteButtons = screen.getAllByTitle(/Delete Track/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/DELETE TRACK/i)).toBeInTheDocument();
  });
});