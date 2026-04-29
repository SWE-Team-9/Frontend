import { useBlockStore } from '@/src/store/useblockStore';
import * as blockService from '@/src/services/blockService';

jest.mock('@/src/services/blockService', () => ({
  getBlockedUsers: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
}));

const getState = () => useBlockStore.getState();

const mockUser = {
  id: 'u1',
  display_name: 'Alice',
  handle: 'alice',
  avatar_url: '',
  blockedAt: '2026-01-01T00:00:00.000Z',
};

describe('useBlockStore', () => {
  beforeEach(() => {
    useBlockStore.setState({ blockedUsers: [], loadingUserId: null, error: null });
    jest.clearAllMocks();
  });

  it('has correct initial state', () => {
    expect(getState().blockedUsers).toEqual([]);
    expect(getState().loadingUserId).toBeNull();
    expect(getState().error).toBeNull();
  });

  describe('clearError', () => {
    it('sets error to null', () => {
      useBlockStore.setState({ error: 'Some error' });
      getState().clearError();
      expect(getState().error).toBeNull();
    });
  });

  describe('fetchBlockedUsers', () => {
    it('sets blockedUsers on success', async () => {
      (blockService.getBlockedUsers as jest.Mock).mockResolvedValue({
        blockedUsers: [mockUser],
        page: 1, limit: 20, total: 1,
      });
      await getState().fetchBlockedUsers();
      expect(getState().blockedUsers).toHaveLength(1);
      expect(getState().blockedUsers[0].id).toBe('u1');
    });

    it('sets error on failure', async () => {
      (blockService.getBlockedUsers as jest.Mock).mockRejectedValue(new Error('Network error'));
      await getState().fetchBlockedUsers();
      expect(getState().error).toBe('Failed to load blocked users. Please try again.');
      expect(getState().blockedUsers).toEqual([]);
    });
  });

  describe('blockUser', () => {
    it('optimistically adds user before API call resolves', async () => {
      (blockService.blockUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (blockService.getBlockedUsers as jest.Mock).mockResolvedValue({ blockedUsers: [], page: 1, limit: 20, total: 0 });
      getState().blockUser('u1', { display_name: 'Alice' });
      expect(getState().blockedUsers.some((u) => u.id === 'u1')).toBe(true);
    });

    it('sets loadingUserId while processing', async () => {
      (blockService.blockUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
      getState().blockUser('u1', { display_name: 'Alice' });
      expect(getState().loadingUserId).toBe('u1');
    });

    it('clears loadingUserId after success', async () => {
      (blockService.blockUser as jest.Mock).mockResolvedValue({});
      (blockService.getBlockedUsers as jest.Mock).mockResolvedValue({ blockedUsers: [mockUser], page: 1, limit: 20, total: 1 });
      await getState().blockUser('u1', { display_name: 'Alice' });
      expect(getState().loadingUserId).toBeNull();
    });

    it('rolls back optimistic update and sets error on failure', async () => {
      (blockService.blockUser as jest.Mock).mockRejectedValue(new Error('Failed'));
      (blockService.getBlockedUsers as jest.Mock).mockResolvedValue({ blockedUsers: [], page: 1, limit: 20, total: 0 });
      await getState().blockUser('u1', { display_name: 'Alice' });
      expect(getState().blockedUsers.some((u) => u.id === 'u1')).toBe(false);
      expect(getState().error).toBe('Failed to block user. Please try again.');
      expect(getState().loadingUserId).toBeNull();
    });
  });

  describe('unblockUser', () => {
    beforeEach(() => {
      useBlockStore.setState({ blockedUsers: [mockUser], loadingUserId: null, error: null });
    });

    it('optimistically removes user before API call resolves', () => {
      (blockService.unblockUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
      getState().unblockUser('u1');
      expect(getState().blockedUsers.some((u) => u.id === 'u1')).toBe(false);
    });

    it('sets loadingUserId while processing', () => {
      (blockService.unblockUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
      getState().unblockUser('u1');
      expect(getState().loadingUserId).toBe('u1');
    });

    it('clears loadingUserId after success', async () => {
      (blockService.unblockUser as jest.Mock).mockResolvedValue({});
      (blockService.getBlockedUsers as jest.Mock).mockResolvedValue({ blockedUsers: [], page: 1, limit: 20, total: 0 });
      await getState().unblockUser('u1');
      expect(getState().loadingUserId).toBeNull();
    });

    it('restores previous state and sets error on failure', async () => {
      (blockService.unblockUser as jest.Mock).mockRejectedValue(new Error('Failed'));
      await getState().unblockUser('u1');
      expect(getState().blockedUsers.some((u) => u.id === 'u1')).toBe(true);
      expect(getState().error).toBe('Failed to unblock user. Please try again.');
      expect(getState().loadingUserId).toBeNull();
    });
  });
});