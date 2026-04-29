import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileActionsMenu from '@/src/components/block-user/ProfileActionsMenu';

const mockBlockUser = jest.fn();
const mockUnblockUser = jest.fn();
const mockFetchBlockedUsers = jest.fn();
const mockClearError = jest.fn();

let mockBlockedUsers: { id: string }[] = [];
let mockLoadingUserId: string | null = null;
let mockError: string | null = null;

jest.mock('@/src/store/useblockStore', () => ({
  useBlockStore: () => ({
    blockUser: mockBlockUser,
    unblockUser: mockUnblockUser,
    blockedUsers: mockBlockedUsers,
    fetchBlockedUsers: mockFetchBlockedUsers,
    loadingUserId: mockLoadingUserId,
    error: mockError,
    clearError: mockClearError,
  }),
}));

jest.mock('react-icons/md', () => ({
  MdMoreVert: () => <span>MenuIcon</span>,
}));

jest.mock('@/src/components/block-user/ConfirmModal', () => ({
  __esModule: true,
  default: ({ open, onClose, onConfirm, displayName, isBlocked }: {
    open: boolean; onClose: () => void; onConfirm: () => void;
    displayName: string; isBlocked: boolean;
  }) =>
    open ? (
      <div data-testid="confirm-modal">
        <span>{isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

const defaultProps = { userId: 'u1', displayName: 'Alice' };

describe('ProfileActionsMenu', () => {
  beforeEach(() => {
    mockBlockedUsers = [];
    mockLoadingUserId = null;
    mockError = null;
    jest.clearAllMocks();
  });

  it('renders the menu toggle button', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    expect(screen.getByText('MenuIcon')).toBeInTheDocument();
  });

  it('calls fetchBlockedUsers on mount when blockedUsers is empty', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    expect(mockFetchBlockedUsers).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchBlockedUsers if blocked users already loaded', () => {
    mockBlockedUsers = [{ id: 'other' }];
    render(<ProfileActionsMenu {...defaultProps} />);
    expect(mockFetchBlockedUsers).not.toHaveBeenCalled();
  });

  it('menu is hidden by default', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    expect(screen.queryByText('Block User')).not.toBeInTheDocument();
  });

  it('opens menu when toggle button is clicked', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    expect(screen.getByText('Block User')).toBeInTheDocument();
  });

  it('shows "Unblock User" when user is already blocked', () => {
    mockBlockedUsers = [{ id: 'u1' }];
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    expect(screen.getByText('Unblock User')).toBeInTheDocument();
  });

  it('opens confirm modal when menu action is clicked', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    fireEvent.click(screen.getByText('Block User'));
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
  });

  it('closes menu when menu action is clicked', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    fireEvent.click(screen.getByText('Block User'));
    expect(screen.queryByText('Block User')).not.toBeInTheDocument();
  });

  it('calls blockUser when confirming block', async () => {
    mockBlockUser.mockResolvedValue({});
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    fireEvent.click(screen.getByText('Block User'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockBlockUser).toHaveBeenCalledWith('u1', { display_name: 'Alice' });
    });
  });

  it('calls unblockUser when confirming unblock', async () => {
    mockBlockedUsers = [{ id: 'u1' }];
    mockUnblockUser.mockResolvedValue({});
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    fireEvent.click(screen.getByText('Unblock User'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockUnblockUser).toHaveBeenCalledWith('u1');
    });
  });

  it('closes confirm modal when Cancel is clicked', () => {
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    fireEvent.click(screen.getByText('Block User'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('shows error when error is set', () => {
    mockError = 'Block failed';
    render(<ProfileActionsMenu {...defaultProps} />);
    expect(screen.getByText('Block failed')).toBeInTheDocument();
  });

  it('calls clearError when × is clicked in error toast', () => {
    mockError = 'Block failed';
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('×'));
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it('shows "Processing..." and disables button when loading', () => {
    mockLoadingUserId = 'u1';
    render(<ProfileActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('MenuIcon').closest('button')!);
    const btn = screen.getByText('Processing...').closest('button')!;
    expect(btn).toBeDisabled();
  });
});