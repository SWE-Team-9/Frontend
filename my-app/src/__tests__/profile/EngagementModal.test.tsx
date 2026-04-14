import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EngagementModal } from '@/src/components/profile/modals/EngagementModal';
import * as interactionService from '@/src/services/interactionService';
import { useAuthStore } from '@/src/store/useAuthStore';

// 1. Mock dependencies
jest.mock('@/src/services/interactionService');
jest.mock('@/src/store/useAuthStore');
jest.mock('@/src/components/profile/sidebar/FollowButton', () => {
  return function MockFollowButton() {
    return <button data-testid="follow-btn">Follow</button>;
  };
});

const mockedInteractions = interactionService as jest.Mocked<typeof interactionService>;
const mockedAuthStore = useAuthStore as unknown as jest.Mock;

describe('EngagementModal', () => {
  const mockUsers = [
    { id: 'u1', display_name: 'User One', handle: 'user1', avatar_url: '' },
    { id: 'u2', display_name: 'User Two', handle: 'user2', avatar_url: '/pic.png' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: User is logged in as 'u1'
    mockedAuthStore.mockReturnValue({ user: { id: 'u1' } });
  });

  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EngagementModal isOpen={false} onClose={jest.fn()} trackId="t1" type="likes" />
    );
    expect(container.firstChild).toBeNull();
  });

  test('fetches and displays users when opened', async () => {
    mockedInteractions.getTrackEngagements.mockResolvedValue(mockUsers);

    render(<EngagementModal isOpen={true} onClose={jest.fn()} trackId="t1" type="likes" />);

    
    expect(screen.getByText(/updating/i)).toBeInTheDocument();

    
    await waitFor(() => {
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText('2 likes')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('hides FollowButton for the current logged-in user', async () => {
    mockedInteractions.getTrackEngagements.mockResolvedValue(mockUsers);

    render(<EngagementModal isOpen={true} onClose={jest.fn()} trackId="t1" type="likes" />);

    await waitFor(() => {
      
      const followButtons = screen.getAllByTestId('follow-btn');
      expect(followButtons).toHaveLength(1);
    });
  });

  test('calls onClose when clicking the background overlay', () => {
    const mockClose = jest.fn();
    const { container } = render(
      <EngagementModal isOpen={true} onClose={mockClose} trackId="t1" type="likes" />
    );

    const overlay = container.querySelector('.fixed.inset-0');
    
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockClose).toHaveBeenCalled();
  });

  test('shows empty state when no users are returned', async () => {
    mockedInteractions.getTrackEngagements.mockResolvedValue([]);

    render(<EngagementModal isOpen={true} onClose={jest.fn()} trackId="t1" type="reposts" />);

    await waitFor(() => {
      expect(screen.getByText(/No reposts yet/i)).toBeInTheDocument();
    });
  });
});