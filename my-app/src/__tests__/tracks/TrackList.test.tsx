import { render, screen, waitFor } from '@testing-library/react';
import TrackList from '../../components/tracks/TrackList';
import React from 'react';
import * as uploadService from '@/src/services/uploadService';

// 1. Mock the service to prevent real API calls
jest.mock('@/src/services/uploadService');
const mockedGetUserTracks = uploadService.getUserTracks as jest.Mock;

describe('TrackList Component (Module 4)', () => {
  const defaultProps = {
    userId: 'user-123',
    type: 'tracks' as const,
    isOwner: true,
  };

  const mockTracksResponse = {
    tracks: [
      {
        trackId: 'track-1',
        title: 'Starboy',
        artist: 'The Weeknd',
        coverArtUrl: '/test-cover.png',
        artistId: 'user-123'
      },
      {
        trackId: 'track-2',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverArtUrl: '/test-cover2.png',
        artistId: 'user-123'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate successful API response
    mockedGetUserTracks.mockResolvedValue(mockTracksResponse);
  });

  /**
   * TEST 1: Initial Loading State
   * Checks if the loading text (from your code) appears initially.
   */
  test('renders initial loading state', () => {
    render(<TrackList {...defaultProps} />);
    expect(screen.getByText(/Loading tracks.../i)).toBeInTheDocument();
  });

  /**
   * TEST 2: Data Rendering
   * Ensures tracks from API are displayed correctly.
   */
  test('renders tracks from API after loading', async () => {
    render(<TrackList {...defaultProps} />);
    
    // Wait for the tracks to appear in the document
    await waitFor(() => {
      expect(screen.getByText('Starboy')).toBeInTheDocument();
      expect(screen.getByText('Blinding Lights')).toBeInTheDocument();
    });
  });

  /**
   * TEST 3: Empty State
   * Ensures the component handles cases with no tracks.
   */
  test('shows empty state message when no tracks are returned', async () => {
    mockedGetUserTracks.mockResolvedValue({ tracks: [] });
    render(<TrackList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/No tracks found/i)).toBeInTheDocument();
    });
  });

  test('reports total tracks through callback for profile stats sync', async () => {
    const onTracksTotalChange = jest.fn();
    mockedGetUserTracks.mockResolvedValue({ ...mockTracksResponse, totalTracks: 7 });

    render(
      <TrackList
        {...defaultProps}
        onTracksTotalChange={onTracksTotalChange}
      />,
    );

    await waitFor(() => {
      expect(onTracksTotalChange).toHaveBeenCalledWith(7);
    });
  });
});