import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TrackList from '../../components/tracks/TrackList';
import React from 'react';
import * as uploadService from '@/src/services/uploadService';

// 1. Mock the service to prevent real API calls
jest.mock('@/src/services/uploadService');
const mockedGetUserTracks = uploadService.getUserTracks as jest.Mock;
const mockedGetTrackDetails = uploadService.getTrackDetails as jest.Mock;
const mockedUpdateTrackMetadata = uploadService.updateTrackMetadata as jest.Mock;

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
    mockedGetTrackDetails.mockResolvedValue({
      title: 'Starboy',
      genre: 'Pop',
      description: 'Initial description',
    });
    mockedUpdateTrackMetadata.mockResolvedValue({});
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

  test('prevents saving edits when required fields are empty', async () => {
    render(<TrackList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Starboy')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/Edit Metadata/i);
    fireEvent.click(editButtons[0]);

    const titleInput = await screen.findByPlaceholderText('Track Title');
    const genreInput = screen.getByPlaceholderText('Genre');
    const descriptionInput = screen.getByPlaceholderText('Description');

    fireEvent.change(titleInput, { target: { value: '   ' } });
    fireEvent.change(genreInput, { target: { value: '' } });
    fireEvent.change(descriptionInput, { target: { value: ' ' } });

    const saveButton = screen.getByRole('button', { name: /save/i });

    expect(saveButton).toBeDisabled();
    expect(
      screen.getByText(/Title, genre, and description are required\./i),
    ).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockedUpdateTrackMetadata).not.toHaveBeenCalled();
  });
});