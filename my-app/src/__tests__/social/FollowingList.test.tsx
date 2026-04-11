import { render, screen, waitFor } from '@testing-library/react';
import { EngagementModal } from '../../components/profile/modals/EngagementModal';
import * as interactionService from '@/src/services/interactionService';

// Mocking the interaction service to simulate fetching the following list
jest.mock('@/src/services/interactionService');
const mockedGetEngagements = interactionService.getTrackEngagements as jest.Mock;

describe('FollowingList UI Testing (Module 3)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    trackId: 'trk_456',
    type: 'reposts' as const, // Using 'reposts' to represent social engagements in this modal
  };

  const mockFollowingUsers = [
    { id: '101', display_name: 'Travis Scott', handle: 'travisscott', avatar_url: '' },
    { id: '102', display_name: 'Post Malone', handle: 'postmalone', avatar_url: '' },
  ];

  beforeEach(() => {
    // Resetting the mock to return following users data
    mockedGetEngagements.mockResolvedValue(mockFollowingUsers);
  });

  /**
   * TEST: Ensure the Following list displays users correctly
   */
  test('renders the following list users successfully', async () => {
    render(<EngagementModal {...defaultProps} />);
    
    // Waiting for the component to display the count and user details
    await waitFor(() => {
      expect(screen.getByText(/2 reposts/i)).toBeInTheDocument();
    });

    // Validating that the names from the Following list are visible
    expect(screen.getByText('Travis Scott')).toBeInTheDocument();
    expect(screen.getByText('Post Malone')).toBeInTheDocument();
  });

  /**
   * TEST: Verify empty state for following list
   */
  test('shows fallback message when current user is not following anyone', async () => {
    mockedGetEngagements.mockResolvedValue([]); 
    render(<EngagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/No reposts yet/i)).toBeInTheDocument();
    });
  });
});