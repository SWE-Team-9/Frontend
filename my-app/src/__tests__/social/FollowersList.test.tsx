import { render, screen, waitFor } from '@testing-library/react';
import { EngagementModal } from '../../components/profile/modals/EngagementModal';
import * as interactionService from '@/src/services/interactionService';

// Mock the interaction service to prevent actual API calls during testing
jest.mock('@/src/services/interactionService');
const mockedGetEngagements = interactionService.getTrackEngagements as jest.Mock;

describe('EngagementModal Component (Followers/Likes UI)', () => {
  // Define default props for the component
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    trackId: 'trk_123',
    type: 'likes' as const, // Testing the 'likes' interaction type
  };

  // Sample mock data simulating a server response
  const mockUsers = [
    { id: '1', display_name: 'The Weeknd', handle: 'theweeknd', avatar_url: '' },
    { id: '2', display_name: 'Drake', handle: 'drake', avatar_url: '' },
  ];

  beforeEach(() => {
    // Reset the mock and define the resolved value before each test
    mockedGetEngagements.mockResolvedValue(mockUsers);
  });

  /**
   * TEST 1: Check if the component renders the header correctly 
   * after fetching data from the mocked service.
   */
  test('renders header with user count and then displays the users list', async () => {
    render(<EngagementModal {...defaultProps} />);
    
    // Wait for the async operation to complete and verify the header text
    await waitFor(() => {
      expect(screen.getByText(/2 likes/i)).toBeInTheDocument();
    });

    // Verify that the mocked user names are rendered in the UI
    expect(screen.getByText('The Weeknd')).toBeInTheDocument();
    expect(screen.getByText('Drake')).toBeInTheDocument();
  });

  /**
   * TEST 2: Verify the empty state UI when no engagement data is returned.
   */
  test('displays an empty state message when no users have interacted', async () => {
    mockedGetEngagements.mockResolvedValue([]); // Simulate an empty response
    render(<EngagementModal {...defaultProps} />);

    // Wait for the UI to update and show the fallback message
    await waitFor(() => {
      expect(screen.getByText(/No likes yet/i)).toBeInTheDocument();
    });
  });

  /**
   * TEST 3: Ensure the onClose callback is triggered correctly.
   */
  test('triggers the onClose function when the close button is clicked', () => {
    render(<EngagementModal {...defaultProps} />);
    
    // Find the close button by its role and simulate a click event
    const closeButton = screen.getByRole('button', { name: '' }); 
    closeButton.click();
    
    // Check if the mocked function was successfully called
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});