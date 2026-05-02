import { useAdminStore } from '@/src/store/useAdminStore'; 
import { adminService } from '@/src/services/admin/adminServiceFactory';
import { useAuthStore } from '@/src/store/useAuthStore';
import { AdminStats, AdminUser, Report } from '@/src/types/admin';

jest.mock('@/src/services/admin/adminServiceFactory');
jest.mock('@/src/store/useAuthStore');

describe('useAdminStore - Unified High-Coverage Suite', () => {
  let spyError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    useAdminStore.setState({
      users: [],
      reports: [],
      dailyStats: [],
      isLoading: false,
      currentUser: null,
      hasHydrated: false,
      pagination: { currentPage: 1, totalPages: 1, totalUsers: 0, limit: 20 },
      reportPagination: { currentPage: 1, totalPages: 1, totalItems: 1 },
    });
  });

  afterEach(() => spyError.mockRestore());

  // --- INITIALIZATION & MAPPING ---
  describe('fetchDashboardData & Mapping', () => {
    it('successfully updates state and covers auth user fallbacks', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { id: 'admin-123', displayName: 'Salma' } 
      });

      const mockStats: Partial<AdminStats> = {
        users: { total: 10, listeners: 5, artists: 5, active: 8, suspended: 1, banned: 1 },
      };

      (adminService.getInitialData as jest.Mock).mockResolvedValue({
        stats: mockStats,
        users: [{ id: 'u1' }],
        reports: [],
        auditLogs: [],
        mostReported: { tracks: [], users: [] },
        analytics: { growth: [], plays: [], storageTrend: [] }
      });

      await useAdminStore.getState().fetchDashboardData();

      const state = useAdminStore.getState();
      expect(state.currentUser?.handle).toBe(''); 
      expect(state.currentUser?.system_role).toBe('USER'); 
      expect(state.stats).toEqual(mockStats);
    });

    it('covers the path where authUser is null', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({ user: null });
      (adminService.getInitialData as jest.Mock).mockResolvedValue({ stats: {}, users: [] });
      await useAdminStore.getState().fetchDashboardData();
      expect(useAdminStore.getState().currentUser).toBeNull();
    });
  });

  describe('fetchDailyStats Edge Cases', () => {
    it('maps metrics correctly and handles null metrics branch', async () => {
      const rawMetrics = {
        metrics: [{ date: '2026-05-01', new_users: 5, tracks_uploaded: 2, total_storage_bytes: 1024 }]
      };
      (adminService.getDailyStats as jest.Mock).mockResolvedValue(rawMetrics);
      await useAdminStore.getState().fetchDailyStats();
      expect(useAdminStore.getState().dailyStats[0].plays_total).toBe(0);

      (adminService.getDailyStats as jest.Mock).mockResolvedValue({ metrics: null });
      await useAdminStore.getState().fetchDailyStats();
      expect(useAdminStore.getState().dailyStats).toEqual([]);
    });
  });

  // --- MODERATION LOGIC & BRANCHING ---
  describe('Moderation Actions', () => {
    it('updateReportStatus: handles assigned_to ternary branches', async () => {
      // FIX 1 & 2: Use unknown as target type to avoid 'any'
      useAdminStore.setState({ 
        currentUser: { id: 'admin-pro' } as unknown as AdminUser, 
        reports: [{ id: 'r1', status: 'PENDING' } as unknown as Report] 
      });

      await useAdminStore.getState().updateReportStatus('r1', 'UNDER_REVIEW');
      expect(adminService.updateReportStatus).toHaveBeenCalledWith('r1', expect.objectContaining({ assigned_to: 'admin-pro' }));

      await useAdminStore.getState().updateReportStatus('r1', 'RESOLVED');
      expect(adminService.updateReportStatus).toHaveBeenLastCalledWith('r1', expect.objectContaining({ assigned_to: undefined }));
    });

    it('moderateContent: covers all content types and the reportId refresh branch', async () => {
      (adminService.getReportsPaginated as jest.Mock).mockResolvedValue({ items: [], pagination: {} });

      await useAdminStore.getState().moderateContent('track', 't1', { reason: 'x' });
      await useAdminStore.getState().moderateContent('playlist', 'p1', { reason: 'x' });
      await useAdminStore.getState().moderateContent('comment', 'c1', { reason: 'x', reportId: 'r1' });

      expect(adminService.moderateTrack).toHaveBeenCalled();
      expect(adminService.moderatePlaylist).toHaveBeenCalled();
      expect(adminService.moderateComment).toHaveBeenCalled();
      expect(adminService.getReportsPaginated).toHaveBeenCalled(); 
    });

    it('moderateTrack and moderateComment trigger fetchDashboardData', async () => {
      const dashSpy = jest.spyOn(adminService, 'getInitialData');
      (adminService.moderateTrack as jest.Mock).mockResolvedValue({});
      (adminService.moderateComment as jest.Mock).mockResolvedValue({});

      await useAdminStore.getState().moderateTrack('t1', { action: 'HIDDEN', reason: 'ok' });
      await useAdminStore.getState().moderateComment('c1', { isHidden: true });

      expect(dashSpy).toHaveBeenCalledTimes(2);
    });
  });

  // --- USER MANAGEMENT & PAGINATION ---
  describe('User Management & Pagination', () => {
    it('suspend, ban, and restore update local status correctly', async () => {
      // FIX 3: Casting to unknown before the target type
      useAdminStore.setState({ users: [{ id: 'u1', account_status: 'ACTIVE' } as unknown as AdminUser] });
      
      await useAdminStore.getState().suspendUser('u1', { current_password: '123', reason: 'x' });
      expect(useAdminStore.getState().users[0].account_status).toBe('SUSPENDED');

      await useAdminStore.getState().banUser('u1', { reason: 'x' });
      expect(useAdminStore.getState().users[0].account_status).toBe('BANNED');

      await useAdminStore.getState().restoreUser('u1', 'mistake');
      expect(useAdminStore.getState().users[0].account_status).toBe('ACTIVE');
    });

    it('loadUsers updates pagination state', async () => {
      const mockData = { users: [{ id: 'u1' }], page: 1, total_pages: 2, total: 40, limit: 20 };
      (adminService.getUsersPaginated as jest.Mock).mockResolvedValue(mockData);

      await useAdminStore.getState().loadUsers(1);
      expect(useAdminStore.getState().pagination.totalUsers).toBe(40);
    });
  });

  // --- UNIVERSAL ERROR HANDLING (CATCH BLOCKS) ---
  describe('Comprehensive Catch Block Coverage', () => {
    const errorScenarios = [
      { method: 'loadUsers', service: 'getUsersPaginated' },
      { method: 'loadReports', service: 'getReportsPaginated' },
      { method: 'fetchUserById', service: 'getUserById' },
      { method: 'fetchDailyStats', service: 'getDailyStats' },
    ] as const; // Added 'as const' to help with indexing

    test.each(errorScenarios)('handles error and resets loading for $method', async ({ method, service }) => {
      (adminService[service as keyof typeof adminService] as jest.Mock).mockRejectedValue(new Error('API Fail'));
      
      // FIX 4: Explicitly typing the store access
      const store = useAdminStore.getState();
      const action = store[method as keyof typeof store] as (arg: string | number) => Promise<void>;
      
      await action('arg1');
      
      expect(spyError).toHaveBeenCalled();
      expect(useAdminStore.getState().isLoading).toBe(false); 
    });
  });
});