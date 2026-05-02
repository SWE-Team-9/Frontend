"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminService } from '@/src/services/admin/adminServiceFactory';
import { useAuthStore } from './useAuthStore';
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
  currentUser: AdminUser | null;
  stats: AdminStats | null;
  users: AdminUser[];
  reports: Report[];
  auditLogs: AuditLog[];
  mostReported: MostReportedStats | null;
  dailyStats: DailyStat[]; // Changed to array to match API metrics
  analytics: AnalyticsData;
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
  isLoading: boolean;
  isUsersLoading: boolean;
  isReportsLoading: boolean;
  isDailyLoading: boolean;
  hasHydrated: boolean;

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
  moderateContent: (type: 'track' | 'playlist' | 'comment', id: string, payload: ActionPayload) => Promise<void>;
  moderateTrack: (trackId: string, payload: { action: 'HIDDEN' | 'REMOVED' | 'VISIBLE'; reason: string; reportId?: string; }) => Promise<void>;
  moderateComment: (commentId: string, payload: { isHidden: boolean; reportId?: string; }) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
}
interface RawDailyMetric {
      date: string;
      new_users: number;
      tracks_uploaded: number;
      total_storage_bytes: number;
      active_subscribers: number;
      plays_total?: number; // Optional if not always there
    }

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      stats: null,
      users: [],
      reports: [],
      auditLogs: [],
      mostReported: null,
      dailyStats: [],
      analytics: {
        storageTrend: [],
        growth: [],
        plays: [],
      },
      pagination: { currentPage: 1, totalPages: 1, totalUsers: 0, limit: 20 },
      reportPagination: { currentPage: 1, totalPages: 1, totalItems: 1 },
      isLoading: false,
      isUsersLoading: false,
      isReportsLoading: false,
      isDailyLoading: false,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      fetchDashboardData: async () => {
        set({ isLoading: true });
        try {
          const authUser = useAuthStore.getState().user;
          if (authUser) {
            set({
              currentUser: {
                id: authUser.id,
                display_name: authUser.displayName,
                handle: authUser.handle ?? '',
                email: authUser.email,
                system_role: authUser.systemRole ?? 'USER',
                account_status: authUser.account_status ?? 'ACTIVE',
                is_verified: authUser.isVerified ?? false,
                created_at: new Date().toISOString(),
                avatar_url: authUser.avatarUrl ?? null,
                account_type: 'LISTENER',
                track_count: 0,
                report_count: 0,
                last_login_at: new Date().toISOString(),
              },
            });
          }

          const data = await adminService.getInitialData();

          set({
            stats: data.stats as AdminStats,
            users: (data.users as AdminUser[]) ?? [],
            reports: (data.reports as Report[]) ?? [],
            auditLogs: (data.auditLogs as AuditLog[]) ?? [],
            mostReported: data.mostReported as MostReportedStats,
            analytics: data.analytics as AnalyticsData,
          });
        } catch (err) {
          console.error('Dashboard fetch failed:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchDailyStats: async (dateFrom, dateTo) => {
  set({ isDailyLoading: true });
  try {
    const res = await adminService.getDailyStats(dateFrom, dateTo);
    
    // We map the raw API data to match your DailyStat interface
    // This resolves the "missing properties" error manually
    
    const rawMetrics = (res.metrics as RawDailyMetric[]) ?? [];
    
    const mappedStats: DailyStat[] = rawMetrics.map((m) => ({
      date: m.date,
      users_total: m.new_users ?? 0,
      tracks_total: m.tracks_uploaded ?? 0,
      plays_total: m.plays_total ?? 0, // Fallback if missing
      storage_used: m.total_storage_bytes ?? 0,
    }));

    set({ dailyStats: mappedStats });
  } catch (err) {
    console.error('Daily stats fetch failed:', err);
  } finally {
    set({ isDailyLoading: false });
  }
},

      loadUsers: async (page = 1) => {
        set({ isUsersLoading: true });
        try {
          const data = await adminService.getUsersPaginated(page, 20);
          set({
            users: data.users as AdminUser[],
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

      loadReports: async (page = 1) => {
        set({ isReportsLoading: true });
        try {
          const response = await adminService.getReportsPaginated(page, 20);
          set({
            reports: response.items as Report[],
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
              r.id === id ? { ...r, status, assigned_to: payload.assigned_to } : r
            ),
          }));
        } catch (err) {
          console.error('Update report failed:', err);
        }
      },

      warnUser: async (userId, payload) => { await adminService.warnUser(userId, payload); },

      suspendUser: async (userId, payload) => {
        if (!payload.current_password) throw new Error("Admin password required.");
        await adminService.suspendUser(userId, payload);
        set((state) => ({
          users: state.users.map((u) => u.id === userId ? { ...u, account_status: 'SUSPENDED' } : u),
        }));
      },

      banUser: async (userId, payload) => {
        await adminService.banUser(userId, payload);
        set((state) => ({
          users: state.users.map((u) => u.id === userId ? { ...u, account_status: 'BANNED' } : u),
        }));
      },

      restoreUser: async (userId, reason) => {
        await adminService.restoreUser(userId, { reason, restoreContent: true });
        set((state) => ({
          users: state.users.map((u) => u.id === userId ? { ...u, account_status: 'ACTIVE' } : u),
        }));
      },

      moderateContent: async (type, id, payload) => {
        if (type === 'track') await adminService.moderateTrack(id, payload);
        if (type === 'playlist') await adminService.moderatePlaylist(id, payload);
        if (type === 'comment') await adminService.moderateComment(id, payload);

        if (payload.reportId) {
          const res = await adminService.getReportsPaginated(1, 50);
          set({ reports: res.items as Report[] });
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

      fetchUserById: async (id) => {
        try {
          const userData = await adminService.getUserById(id);
          set((state) => ({
            users: [...state.users.filter((u) => u.id !== id), userData as AdminUser],
          }));
        } catch (error) {
          console.error("Fetch user failed:", error);
        }
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);