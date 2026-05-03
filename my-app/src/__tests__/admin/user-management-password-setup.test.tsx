import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UserManagementPage from '@/src/app/admin/users/page';

const mockLoadUsers = jest.fn().mockResolvedValue(undefined);
const mockSuspendUser = jest.fn();
const mockBanUser = jest.fn().mockResolvedValue(undefined);
const mockRestoreUser = jest.fn().mockResolvedValue(undefined);
const mockApiPost = jest.fn();
const mockApiGet = jest.fn();

jest.mock('@/src/services/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockApiPost(...args),
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

jest.mock('@/src/components/admin/RoleGuard', () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/src/components/admin/TablePagination', () => ({
  TablePagination: () => <div data-testid="table-pagination" />,
}));

jest.mock('@/src/store/useAdminStore', () => ({
  useAdminStore: () => ({
    users: [
      {
        id: 'u1',
        display_name: 'Target User',
        email: 'target@example.com',
        system_role: 'USER',
        account_status: 'ACTIVE',
        is_verified: true,
        created_at: '2026-01-01T00:00:00.000Z',
        report_count: 0,
      },
    ],
    loadUsers: mockLoadUsers,
    suspendUser: mockSuspendUser,
    banUser: mockBanUser,
    restoreUser: mockRestoreUser,
    pagination: { currentPage: 1, totalPages: 1 },
  }),
}));

describe('Admin Users Page - password setup flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { hasPassword: false } });
  });

  it('shows setup password UI proactively for admins without password', async () => {
    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const row = screen.getByText('Target User').closest('tr');
    expect(row).toBeTruthy();
    const buttons = within(row as HTMLElement).getAllByRole('button');

    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Suspend Account?')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Set Local Admin Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Set Admin Password' })).toBeInTheDocument();
    });
  });

  it('calls setup endpoint and asks admin to retry confirmation', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { hasPassword: true } });

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const row = screen.getByText('Target User').closest('tr');
    const buttons = within(row as HTMLElement).getAllByRole('button');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Suspend Account?')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Set Admin Password' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('New Admin Password'), {
      target: { value: 'StrongP@ssw0rd' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Admin Password'), {
      target: { value: 'StrongP@ssw0rd' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set Admin Password' }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/password/setup', {
        newPassword: 'StrongP@ssw0rd',
        confirmPassword: 'StrongP@ssw0rd',
      });
      expect(
        screen.getByText('Password set successfully. Please enter it above and confirm the action.'),
      ).toBeInTheDocument();
    });
  });

  it('does not show setup password UI for admins who already have password', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { hasPassword: true } });

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const row = screen.getByText('Target User').closest('tr');
    const buttons = within(row as HTMLElement).getAllByRole('button');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Suspend Account?')).toBeInTheDocument();
    });

    expect(screen.queryByText('Set Local Admin Password')).not.toBeInTheDocument();
  });
});
