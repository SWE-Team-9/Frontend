import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminService } from '@/src/services/admin/adminService';
import {
  AdminUser,
  Report,
  AuditLog,
  MostReportedStats,
  AnalyticsData,
  AdminStats,
  DailyStat,
  ActionPayload
} from '@/src/types/admin';

interface AdminState {
  // =========================
  // CORE STATE
  // =========================
  currentUser: AdminUser | null;
  stats: AdminStats | null;

  users: AdminUser[];
  reports: Report[];
  auditLogs: AuditLog[];
  mostReported: MostReportedStats | null;

  // =========================
  // ANALYTICS
  // =========================
  dailyStats: DailyStat;
  analytics:AnalyticsData
  // =========================
  // PAGINATION
  // =========================
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
  };

  reportPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };

  // =========================
  // LOADING STATES
  // =========================
  isLoading: boolean;
  isUsersLoading: boolean;
  isReportsLoading: boolean;
  isDailyLoading: boolean;

  hasHydrated: boolean;

  // =========================
  // ACTIONS
  // =========================
  setHasHydrated: (state: boolean) => void;

  fetchDashboardData: () => Promise<void>;
  fetchDailyStats: (dateFrom?: string, dateTo?: string) => Promise<void>;

  loadUsers: (page?: number) => Promise<void>;
  loadReports: (page?: number) => Promise<void>;

  updateReportStatus: (id: string, status: Report['status']) => Promise<void>;

  warnUser: (userId: string, payload: ActionPayload) => Promise<void>;
  suspendUser: (userId: string, payload: ActionPayload) => Promise<void>;
  banUser: (userId: string, payload: ActionPayload) => Promise<void>;
  restoreUser: (userId: string, reason: string) => Promise<void>;

  moderateContent: (
    type: 'track' | 'playlist' | 'comment',
    id: string,
    payload: ActionPayload
  ) => Promise<void>;

  moderateTrack: (
    trackId: string,
    payload: {
      action: 'HIDE' | 'DELETE' | 'RESTORE';
      reason: string;
      reportId?: string;
    }
  ) => Promise<void>;

  moderateComment: (
    commentId: string,
    payload: {
      isHidden: boolean;
      reportId?: string;
    }
  ) => Promise<void>;

  fetchUserById: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({

      // =========================
      // INITIAL STATE
      // =========================
      currentUser: {
        id: "admin-1",
        display_name: "Super Admin",
        handle: "admin",
        email: "admin@system.com",
        account_status: "ACTIVE",
        is_verified: true,
        system_role: "ADMIN",
        created_at: new Date().toISOString(),
        avatar_url: null,
        account_type: "PRO",
        track_count: 0,
        report_count: 0,
        last_login_at: new Date().toISOString()
      },

      stats: null,
      users: [],
      reports: [],
      auditLogs: [],
      mostReported: null,

      dailyStats:{
        date: "5",
        users_total: 5,
        tracks_total: 0,
        plays_total: 2,
        storage_used: 2},
      analytics: {
        storageTrend: [],
        growth: [],
        plays: [],
      },

      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 20,
      },

      reportPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
      },

      // =========================
      // LOADING
      // =========================
      isLoading: false,
      isUsersLoading: false,
      isReportsLoading: false,
      isDailyLoading: false,

      hasHydrated: false,

      // =========================
      // CORE ACTIONS
      // =========================
      setHasHydrated: (state) => set({ hasHydrated: state }),

      fetchDashboardData: async () => {
        set({ isLoading: true });

        try {
          const data = await adminService.getInitialData();

          set({
            stats: data.stats,
            users: data.users,
            reports: data.reports,
            auditLogs: data.auditLogs,
            mostReported: data.mostReported,
            analytics: data.analytics,
          });
        } catch (err) {
          console.error('Dashboard fetch failed:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      // ✅ NEW (IMPORTANT)
      fetchDailyStats: async (dateFrom?: string, dateTo?: string) => {
        set({ isDailyLoading: true });

        try {
          const res = await adminService.getDailyStats(dateFrom, dateTo);

          set({
            dailyStats: res.metrics ?? [],
          });
        } catch (err) {
          console.error('Daily stats fetch failed:', err);
        } finally {
          set({ isDailyLoading: false });
        }
      },

      // =========================
      // USERS
      // =========================
      loadUsers: async (page = 1) => {
        set({ isUsersLoading: true });

        try {
          const data = await adminService.getUsersPaginated(page, 20);

          set({
            users: data.users,
            pagination: {
              currentPage: data.page,
              totalPages: data.total_pages,
              totalUsers: data.total,
              limit: data.limit,
            },
          });
        } catch (error) {
          console.error("Failed to load users:", error);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      // =========================
      // REPORTS
      // =========================
      loadReports: async (page = 1) => {
        set({ isReportsLoading: true });

        try {
          const response = await adminService.getReportsPaginated(page, 20);

          set({
            reports: response.items,
            reportPagination: {
              currentPage: response.pagination.page,
              totalPages: response.pagination.totalPages,
              totalItems: response.pagination.total,
            },
          });
        } catch (error) {
          console.error("Failed to load reports:", error);
        } finally {
          set({ isReportsLoading: false });
        }
      },

      updateReportStatus: async (id, status) => {
        const { currentUser } = get();

        try {
          const payload: ActionPayload = {
            status,
            assigned_to: status === 'UNDER_REVIEW' ? currentUser?.id : undefined,
          };

          await adminService.updateReportStatus(id, payload);

          set((state) => ({
            reports: state.reports.map((r) =>
              r.id === id
                ? { ...r, status, assigned_to: payload.assigned_to }
                : r
            ),
          }));
        } catch (err) {
          console.error('Update report failed:', err);
        }
      },

      // =========================
      // USER ACTIONS
      // =========================
      warnUser: async (userId, payload) => {
        await adminService.warnUser(userId, payload);
      },

      suspendUser: async (userId, payload) => {
        if (!payload.current_password) return;

        if (!payload.current_password) {
          throw new Error("Admin password is required for suspension.");
        }

        await adminService.suspendUser(userId, {...payload,current_password: payload.current_password, });

        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, account_status: 'SUSPENDED' } : u
          ),
        }));
      },

      banUser: async (userId, payload) => {
        await adminService.banUser(userId, payload);

        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, account_status: 'BANNED' } : u
          ),
        }));
      },

      restoreUser: async (userId, reason) => {
        await adminService.restoreUser(userId, { reason, restoreContent: true });

        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, account_status: 'ACTIVE' } : u
          ),
        }));
      },

      // =========================
      // MODERATION
      // =========================
      moderateContent: async (type, id, payload) => {
        if (type === 'track') await adminService.moderateTrack(id, payload);
        if (type === 'playlist') await adminService.moderatePlaylist(id, payload);
        if (type === 'comment') await adminService.moderateComment(id, payload);

        if (payload.reportId) {
          const reportsData = await adminService.getReports();
          set({ reports: reportsData.reports ?? reportsData });
        }
      },

      moderateTrack: async (trackId, payload) => {
        await adminService.moderateTrack(trackId, payload);
        await get().fetchDashboardData();
      },

      moderateComment: async (commentId, payload) => {
        await adminService.moderateComment(commentId, payload);
        await get().fetchDashboardData();
      },

      // =========================
      // FETCH SINGLE USER
      // =========================
      fetchUserById: async (id) => {
        try {
          const userData = await adminService.getUserById(id);

          set((state) => ({
            users: [
              ...state.users.filter((u) => u.id !== id),
              userData,
            ],
          }));
        } catch (error) {
          console.error("Fetch user failed:", error);
        }
      },
    }),

    {
      name: 'admin-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);