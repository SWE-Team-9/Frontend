import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminService } from '@/src/services/admin/adminService';
import { useAuthStore } from './useAuthStore';
import {
  AdminUser,
  Report,
  AuditLog,
  MostReportedStats,
  AnalyticsData,
  AdminStats,
  ActionPayload
} from '@/src/types/admin';

interface AdminState {
  currentUser: AdminUser | null;
  stats: AdminStats | null;
  reports: Report[];
  users: AdminUser[];
  auditLogs: AuditLog[];
  mostReported: MostReportedStats | null;
  analytics: AnalyticsData | null;
  isLoading: boolean;
  hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  fetchDashboardData: () => Promise<void>;
  updateReportStatus: (id: string, status: Report['status']) => Promise<void>;
  warnUser: (userId: string, payload: ActionPayload) => Promise<void>;
  suspendUser: (userId: string, payload: ActionPayload) => Promise<void>;
  banUser: (userId: string, payload: ActionPayload) => Promise<void>;
  restoreUser: (userId: string, reason: string) => Promise<void>;
  moderateContent: (type: 'track' | 'playlist' | 'comment', id: string, payload: ActionPayload) => Promise<void>;
  moderateTrack: (trackId: string, payload: {
    action: 'HIDE' | 'DELETE';
    reason: string;
    reportId?: string;
  }) => Promise<void>;
  moderateComment: (commentId: string, payload: {
    isHidden: boolean;
    reportId?: string;
  }) => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      stats: null,
      reports: [],
      users: [],
      auditLogs: [],
      mostReported: null,
      analytics: null,
      isLoading: false,
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
                account_status: 'ACTIVE',
                is_verified: authUser.isVerified ?? false,
                created_at: '',
                avatar_url: authUser.avatarUrl ?? null,
                account_type: 'LISTENER',
                track_count: 0,
                report_count: 0,
                last_login_at: '',
              },
            });
          }

          const data = await adminService.getInitialData();
          set({
            stats: data.stats,
            users: data.users,
            reports: data.reports,
            analytics: data.analytics,
            auditLogs: data.auditLogs,
            mostReported: data.mostReported
          });
        } catch (err) {
          console.error('Fetch failed:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      updateReportStatus: async (id, status) => {
        const { currentUser } = get();
        try {
          const payload: ActionPayload = {
            status,
            assigned_to: status === 'UNDER_REVIEW' ? currentUser?.id : undefined
          };

          await adminService.updateReportStatus(id, payload);

          set((state) => ({
            reports: state.reports.map((r) =>
              r.id === id
                ? {
                  ...r,
                  status,
                  assigned_to: status === 'UNDER_REVIEW' ? currentUser?.id : r.assigned_to
                }
                : r
            )
          }));
        } catch (err) {
          console.error('Update failed:', err);
        }
      },

      warnUser: async (userId, payload) => {
        try {
          await adminService.warnUser(userId, payload);
        } catch (err) {
          console.error('Warn failed:', err);
          throw err;
        }
      },

      suspendUser: async (userId, payload) => {
        if (!payload.current_password) {
          console.error('Suspension requires admin confirmation password.');
          return;
        }

        try {
          await adminService.suspendUser(userId, payload as ActionPayload & { current_password: string });

          set((state) => ({
            users: state.users.map((u) =>
              u.id === userId ? { ...u, account_status: 'SUSPENDED' } : u
            )
          }));
        } catch (err) {
          console.error('Suspend failed:', err);
          throw err;
        }
      },

      banUser: async (userId, payload) => {
        try {
          await adminService.banUser(userId, payload);
          set((state) => ({
            users: state.users.map((u) =>
              u.id === userId ? { ...u, account_status: 'BANNED' } : u
            )
          }));
        } catch (err) {
          console.error('Ban failed:', err);
          throw err;
        }
      },

      restoreUser: async (userId, reason) => {
        try {
          await adminService.restoreUser(userId, { reason, restoreContent: true });
          set((state) => ({
            users: state.users.map((u) =>
              u.id === userId ? { ...u, account_status: 'ACTIVE' } : u
            )
          }));
        } catch (err) {
          console.error('Restore failed:', err);
        }
      },

      moderateContent: async (type, id, payload) => {
        try {
          if (type === 'track') await adminService.moderateTrack(id, payload);
          else if (type === 'playlist') await adminService.moderatePlaylist(id, payload);
          else if (type === 'comment') await adminService.moderateComment(id, payload);

          if (payload.reportId) {
            const reportsData = await adminService.getReports();
            set({ reports: reportsData.reports ?? reportsData });
          }
        } catch (err) {
          console.error('Moderation failed:', err);
          throw err;
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
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ currentUser: state.currentUser })
    }
  )
);