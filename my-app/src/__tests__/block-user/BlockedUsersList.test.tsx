/* eslint-disable react/display-name */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockedUsersList from '@/src/components/block-user/BlockedUsersList';

const mockUnblockUser = jest.fn();
const mockClearError = jest.fn();

let mockBlockedUsers: { id: string; display_name: string; handle?: string; avatar_url?: string }[] = [];
let mockLoadingUserId: string | null = null;
let mockError: string | null = null;

jest.mock('@/src/store/useblockStore', () => ({
  useBlockStore: () => ({
    blockedUsers: mockBlockedUsers,
    unblockUser: mockUnblockUser,
    loadingUserId: mockLoadingUserId,
    error: mockError,
    clearError: mockClearError,
  }),
}));

jest.mock('next/image', () => {
  const MockImage = ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  );
  MockImage.displayName = 'MockImage';
  return { __esModule: true, default: MockImage };
});

describe('BlockedUsersList', () => {
  beforeEach(() => {
    mockBlockedUsers = [];
    mockLoadingUserId = null;
    mockError = null;
    jest.clearAllMocks();
  });

  it('renders empty list when no blocked users', () => {
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders a blocked user display name and handle', () => {
    mockBlockedUsers = [{ id: 'u1', display_name: 'Alice', handle: 'alice99' }];
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('@alice99')).toBeInTheDocument();
  });

  it('shows initial letter when no avatar_url', () => {
    mockBlockedUsers = [{ id: 'u1', display_name: 'Bob' }];
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders avatar image when avatar_url is provided', () => {
    mockBlockedUsers = [{ id: 'u1', display_name: 'Carol', avatar_url: 'https://example.com/avatar.jpg' }];
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.getByAltText('Carol')).toBeInTheDocument();
  });

  it('calls unblockUser with correct id when Unblock is clicked', () => {
    mockBlockedUsers = [{ id: 'u1', display_name: 'Alice' }];
    render(<BlockedUsersList loadingUserId={null} />);
    fireEvent.click(screen.getByText('Unblock'));
    expect(mockUnblockUser).toHaveBeenCalledWith('u1');
  });

  it('shows "Processing…" and disables button when loadingUserId matches', () => {
    mockBlockedUsers = [{ id: 'u1', display_name: 'Alice' }];
    mockLoadingUserId = 'u1';
    render(<BlockedUsersList loadingUserId="u1" />);
    const btn = screen.getByText('Processing…').closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('shows error message when error is set', () => {
    mockError = 'Something went wrong';
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls clearError when × is clicked', () => {
    mockError = 'Something went wrong';
    render(<BlockedUsersList loadingUserId={null} />);
    fireEvent.click(screen.getByText('×'));
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it('does not show error banner when no error', () => {
    render(<BlockedUsersList loadingUserId={null} />);
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });
});