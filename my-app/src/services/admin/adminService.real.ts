import { AdminStats, ActionPayload, AdminUser, Report } from "@/src/types/admin";
import { adminApi } from "@/src/services/admin/adminService";

interface DailyMetric {
  date: string;
  total_storage_bytes: number;
  new_users: number;
  tracks_uploaded: number;
}
interface RawAuditAction {
  id?: string | number;
  action_type?: string;
  admin?: {
    id: string;
    display_name: string;
    handle: string;
  };
  target_user?: {
    id: string;
    display_name: string;
    handle: string;
  };
  target_track?: { id: string };
  target_comment?: { id: string };
  target_playlist?: { id: string };
  notes?: string;
  created_at?: string;
}

/**
 * Helper to format storage bytes into human-readable strings
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}


/**
 * Transforms raw API overview data into the structured AdminStats type
 */
function transformOverviewStats(raw: Record<string, Record<string, number | null>>): AdminStats {
  const users = raw.users ?? {};
  const content = raw.content ?? {};
  const engagement = raw.engagement ?? {};
  const billing = raw.billing ?? {};
  const moderation = raw.moderation ?? {};

  const usedBytes = (billing.total_storage_bytes as number) ?? 0;
  const totalBytes = (billing.total_storage_limit as number) ?? 107374182400;

  return {
    users: {
      total: (users.total as number) ?? 0,
      listeners: (users.listeners as number) ?? 0,
      artists: (users.artists as number) ?? 0,
      active: (users.active as number) ?? 0,
      suspended: (users.suspended as number) ?? 0,
      banned: (users.banned as number) ?? 0,
      artist_to_listener_ratio: (users.artist_to_listener_ratio as number) ?? null,
    },
    storage: {
      used_bytes: usedBytes,
      total_bytes:totalBytes,
      total_human_readable: formatBytes(usedBytes),
    },
    content: {
      total_tracks: (content.total_tracks as number) ?? 0,
      tracks_visible: (content.tracks_visible as number) ?? 0,
    },
    moderation: {
      reports_pending: (moderation.reports_pending as number) ?? 0,
    },
    engagement: {
      total_play_events: (engagement.total_play_events as number) ?? 0,
      completed_play_events: (engagement.completed_play_events as number) ?? 0,
      play_through_rate_pct: (engagement.play_through_rate_pct as number) ?? 0,
    },
  };
}

export const adminServiceReal = {
  getInitialData: async () => {
    const [rawStats, usersData, reportsData, auditData, mostReportedData, dailyData,totalStorage] =
      await Promise.all([
        adminApi.get('/admin/stats/overview').then(r => r.data),
        adminApi.get('/admin/users').then(r => r.data),
        adminApi.get('/admin/reports').then(r => r.data),
        adminApi.get('/admin/audit-log').then(r => r.data).catch(() => ({ items: [] })),
        adminApi.get('/admin/stats/most-reported').then(r => r.data).catch(() => null),
        adminApi.get('/admin/stats/daily', { params: { granularity: 'monthly' } }).then(r => r.data),
        adminApi.get(`/admin/storage/total`).then(r=>r.data),
      ]);

    const stats = transformOverviewStats(rawStats);
    const storageTrend = (dailyData.metrics as DailyMetric[] || []).map((m) => ({
      date: m.date,
      value: m.total_storage_bytes,
      newUsers: m.new_users,
      tracks: m.tracks_uploaded
    }));

    return {
      stats,
      users: (usersData.users as AdminUser[]) ?? (usersData as AdminUser[]),
      totalStorage: totalStorage,
      reports: (reportsData.items as Report[]) ?? (reportsData.reports as Report[]) ?? (reportsData as Report[]),
      analytics: {
        growth: storageTrend,
        plays: [],
        storageTrend: storageTrend
      },
      auditLogs: (auditData.items as Record<string, unknown>[]) ?? [],
      mostReported: mostReportedData ? {
        tracks: (mostReportedData.mostReportedTracks || mostReportedData.tracks || []) as Record<string, unknown>[],
        users: (mostReportedData.mostReportedUsers || mostReportedData.users || []) as Record<string, unknown>[],
      } : null,
    };
  },
 
  getUserById: async (id: string) => {
    const res = await adminApi.get(`/admin/users/${id}`);
    return (res.data.user as AdminUser) ?? (res.data as AdminUser);
  },

  getUsersPaginated: async (page: number, limit: number) => {
    const response = await adminApi.get(`/admin/users`, {
      params: { page, limit }
    });
    return response.data;
  },

  getReports: async () => {
    const r = await adminApi.get('/admin/reports');
    return (r.data.items as Report[]) ?? (r.data.reports as Report[]) ?? (r.data as Report[]);
  },

  getReportById: async (reportId: string) => {
    const r = await adminApi.get(`/admin/reports/${reportId}`);
    return r.data as Report;
  },

  getReportsPaginated: async (page: number, limit: number) => {
    const response = await adminApi.get(`/admin/reports`, {
      params: { page, limit }
    });
    return response.data;
  },

  getAuditLog: async (page = 1, limit = 20) => {
    const r = await adminApi.get('/admin/audit-log', { params: { page, limit } });
    const data = r.data;
    const actions = (data.actions as RawAuditAction[]) ?? [];

    const items = actions.map((action) => {
      let entity_type: "TRACK" | "USER" | "COMMENT" | "PLAYLIST" | undefined = undefined;
      if (action.target_track) entity_type = "TRACK";
      else if (action.target_user) entity_type = "USER";
      else if (action.target_comment) entity_type = "COMMENT";
      else if (action.target_playlist) entity_type = "PLAYLIST";

      return {
        id: String(action.id ?? ''),
        action_type: String(action.action_type ?? ''),
        admin_id: (action.admin?.id as string) ?? '',
        admin_name: action.admin?.display_name as string,
        admin_handle: action.admin?.handle as string,
        target_user_name: action.target_user?.display_name as string,
        target_user_handle: action.target_user?.handle as string,
        entity_type,
        entity_id: (action.target_track?.id ?? action.target_user?.id ?? action.target_comment?.id ?? action.target_playlist?.id) as string,
        notes: action.notes as string,
        created_at: String(action.created_at ?? ''),
      };
    });

    return {
      items,
      pagination: { totalPages: (data.total_pages as number) ?? 1 },
    };
  },

  getDailyStats: async (dateFrom?: string, dateTo?: string) => {
    const r = await adminApi.get('/admin/stats/daily', {
      params: { dateFrom, dateTo },
    });
    return {
      metrics: (r.data.metrics as DailyMetric[]) ?? [],
      date_from: r.data.date_from as string,
      date_to: r.data.date_to as string,
    };
  },

  warnUser: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('warn', id, payload),

  suspendUser: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('suspend', id, payload),

  banUser: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('ban', id, payload),

  restoreUser: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('restore', id, payload),

  updateReportStatus: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('report-status', id, payload),

  moderateTrack: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('track-mod', id, payload),

  moderateComment: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('comment-mod', id, payload),

  moderatePlaylist: async (id: string, payload: ActionPayload) =>
    adminServiceReal.submitAction('playlist-mod', id, payload),

  submitAction: async (type: string, id: string, payload: ActionPayload) => {
    // Define an extended type to safely access potential snake_case keys
    type ExtendedPayload = ActionPayload & { 
      current_password?: string; 
      duration_days?: number; 
      moderation_state?: string; 
      action?: string;
      isHidden?: boolean;
    };
    
    const p = payload as ExtendedPayload;
    const password = p.currentPassword ?? p.current_password;

    switch (type) {
      case 'warn':
        return adminApi.post(`/admin/users/${id}/warn`, {
          reason: p.reason,
          currentPassword: password,
          reportId: p.reportId,
        });
      case 'suspend':
        return adminApi.post(`/admin/users/${id}/suspend`, {
          durationDays: p.durationDays ?? p.duration_days ?? 7,
          reason: p.reason,
          currentPassword: password,
          reportId: p.reportId,
        });
      case 'ban':
        return adminApi.post(`/admin/users/${id}/ban`, {
          reason: p.reason,
          currentPassword: password,
          reportId: p.reportId,
        });
      case 'restore':
      case 'activate':
        return adminApi.post(`/admin/users/${id}/restore`, {
          reason: p.reason,
          restoreContent: p.restoreContent ?? false,
        });
      case 'track-mod': {
        const rawState = p.moderationState || p.moderation_state || p.action;

        let finalState = 'VISIBLE';
        if (typeof rawState === 'string') {
          const upper = rawState.toUpperCase();
          if (upper.includes('HID')) finalState = 'HIDDEN';
          else if (upper.includes('REM')) finalState = 'REMOVED';
          else if (upper.includes('VIS')) finalState = 'VISIBLE';
        }

        return adminApi.patch(`/admin/tracks/${id}/moderation`, {
          moderationState: finalState,
          reason: p.reason || 'Action taken by administrator',
          reportId: p.reportId,
        });
      }
      case 'comment-mod':
        return adminApi.patch(`/admin/comments/${id}/moderation`, {
          isHidden: p.isHidden,
          reason: p.reason,
          reportId: p.reportId,
        });
      case 'playlist-mod':
        return adminApi.patch(`/admin/playlists/${id}/moderation`, {
          moderationState: p.moderationState ?? p.moderation_state,
          reason: p.reason,
          reportId: p.reportId,
        });
      case 'report-status':
        return adminApi.patch(`/admin/reports/${id}`, payload);
      case 'report-assign':
        return adminApi.patch(`/admin/reports/${id}/assign`, payload);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  },

  hideTrack: async (trackId: string, reason = 'Hidden by admin') => {
    return adminApi.patch(`/admin/tracks/${trackId}/moderation`, {
      moderationState: 'HIDDEN',
      reason,
    });
  },

  restoreTrack: async (trackId: string, reason = 'Restored by admin') => {
    return adminApi.patch(`/admin/tracks/${trackId}/moderation`, {
      moderationState: 'VISIBLE',
      reason,
    });
  },
  hideComment: async (commentId: string, reportId?: string) => {
  return adminApi.patch(`/admin/comments/${commentId}/moderation`, {
    isHidden: true,
    reason: "Hidden by admin",
    reportId,
  });
},

restoreComment: async (commentId: string, reportId?: string) => {
  return adminApi.patch(`/admin/comments/${commentId}/moderation`, {
    isHidden: false,
    reason: "Restored by admin",
    reportId,
  });
},

  addModeratorReview: async ({ reportId, content }: { reportId: string; content: string }) => {
    return adminApi.patch(`/admin/reports/${reportId}`, { resolutionNotes: content });
  },

  bulkUpdateReports: async (reportIds: string[], status: string, resolutionNotes?: string) => {
    return adminApi.patch('/admin/reports/bulk', { reportIds, status, resolutionNotes });
  },
};