import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminService } from '@/src/services/admin/adminService';
import{ActionPayload} from "@/src/types/admin";
import {
  AdminUser,
  Report,
  AuditLog,
  MostReportedStats,
  AnalyticsData,
  AdminStats
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

  
  setCurrentUser: (user: AdminUser) => void;

  fetchDashboardData: () => Promise<void>;
  updateReportStatus: (
    id: string,
    status: 'RESOLVED' | 'REJECTED'
  ) => Promise<void>;
  warnUser: (userId: string, payload: ActionPayload) => Promise<void>;
  suspendUser: (
    userId: string,
    days: number,
    payload: ActionPayload
  ) => Promise<void>;
  banUser: (userId: string, payload: ActionPayload) => Promise<void>;
  getUserById: (id: string) => Promise<AdminUser | null>;
  moderateContent: (
    type: string,
    id: string,
    payload: ActionPayload
  ) => Promise<void>;
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

      
      setCurrentUser: (user) => set({ currentUser: user }),

     
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
            analytics: data.analytics
          });

         
          if (!get().currentUser) {
            set({
              currentUser: {
                id: 'admin-1',
                display_name: 'Super Admin',
                handle: 'admin',
                email: 'admin@system.com',
                system_role: 'ADMIN',
                account_status: 'ACTIVE',
                is_verified: true,
                created_at: new Date().toISOString(),
                avatar_url: null,
                account_type: "PRO",
                track_count: 0,
                report_count: 0,
                last_login_at: new Date().toISOString()
              }
            });
          }

        } catch (err) {
          console.error('Fetch failed:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      
      updateReportStatus: async (id, status) => {
        try {
          await adminService.submitAction('report-status', id, { status });

          set((state) => ({
            reports: state.reports.map((r) =>
              r.id === id ? { ...r, status } : r
            )
          }));
        } catch (err) {
          console.error('Failed to update report status:', err);
        }
      },

      warnUser: async (id, payload) => {
        try {
          await adminService.submitAction('warn', id, payload);
        } catch (err) {
          console.error('Warn failed:', err);
        }
      },

      
      suspendUser: async (id, days, payload) => {
        const actionType = days > 0 ? 'suspend' : 'activate';

        try {
          await adminService.submitAction(actionType, id, {
            ...payload,
            ...(days > 0 && { duration_days: days })
          });

          set((state) => ({
            users: state.users.map((u) =>
              u.id === id
                ? {
                    ...u,
                    account_status: days > 0 ? 'SUSPENDED' : 'ACTIVE'
                  }
                : u
            )
          }));
        } catch (err) {
          console.error('Suspend failed:', err);
        }
      },

      
      banUser: async (id, payload) => {
        try {
          await adminService.submitAction('ban', id, payload);

          set((state) => ({
            users: state.users.map((u) =>
              u.id === id ? { ...u, account_status: 'BANNED' } : u
            )
          }));
        } catch (err) {
          console.error('Ban failed:', err);
        }
      },

      
      getUserById: async (id: string) => {
        const existing = get().users.find((u) => u.id === id);
        if (existing) return existing;

        try {
          const user = await adminService.getUserById(id);

          if (user) {
            set((state) => ({
              users: [...state.users, user]
            }));
          }

          return user;
        } catch (err) {
          console.error(`Failed to fetch user ${id}:`, err);
          return null;
        }
      },

      
      moderateContent: async (type, id, payload) => {
        try {
          await adminService.submitAction(type, id, payload);

          set((state) => {
            if (!state.stats) return state;

            if (payload.moderation_state === 'REMOVED') {
              return {
                stats: {
                  ...state.stats,
                  content: {
                    ...state.stats.content,
                    tracks_visible: Math.max(
                      0,
                      state.stats.content.tracks_visible - 1
                    )
                  }
                }
              };
            }

            return state;
          });

        } catch (err) {
          console.error('Moderation failed:', err);
        }
      },
    }),
    {
      name: 'admin-storage',

      
      partialize: (state) => ({
        currentUser: state.currentUser
      })
    }
  )
);