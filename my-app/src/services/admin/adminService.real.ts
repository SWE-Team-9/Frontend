import api from "@/src/services/api";
import { AdminStats, ActionPayload } from "@/src/types/admin";



function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function transformOverviewStats(raw: Record<string, unknown>): AdminStats {
  const users = (raw.users as Record<string, number>) ?? {};
  const content = (raw.content as Record<string, number>) ?? {};
  const engagement = (raw.engagement as Record<string, number>) ?? {};
  const billing = (raw.billing as Record<string, number>) ?? {};
  const moderation = (raw.moderation as Record<string, number>) ?? {};

  const usedBytes = billing.total_storage_bytes ?? 0;
  const totalBytes = billing.total_storage_limit ?? 107374182400;
  return {
    users: {
      total: users.total ?? 0,
      listeners: users.listeners ?? 0,
      artists: users.artists ?? 0,
      active: users.active ?? 0,
      suspended: users.suspended ?? 0,
      banned: users.banned ?? 0,
      artist_to_listener_ratio: users.artist_to_listener_ratio ?? null,
    },
    storage: {
      used_bytes: usedBytes,
      total_bytes: totalBytes,
      total_human_readable: formatBytes(usedBytes),
    },
    content: {
      total_tracks: content.total_tracks ?? 0,
      tracks_visible: content.tracks_visible ?? 0,
    },
    moderation: {
      reports_pending: moderation.reports_pending ?? 0,
    },
    engagement: {
      total_play_events: engagement.total_play_events ?? 0,
      completed_play_events: engagement.completed_play_events ?? 0,
      play_through_rate_pct: engagement.play_through_rate_pct ?? 0,
    },
  };
}

export const adminServiceReal = {
  getInitialData: async () => {
    const [rawStats, usersData, reportsData, auditData, mostReportedData] =
      await Promise.all([
        api.get('/admin/stats/overview').then(r => r.data),
        api.get('/admin/users').then(r => r.data),
        api.get('/admin/reports').then(r => r.data),
        api.get('/admin/audit-log').then(r => r.data).catch(() => ({ items: [] })),
        api.get('/admin/stats/most-reported').then(r => r.data).catch(() => null),
      ]);

    const stats = transformOverviewStats(rawStats);

    return {
      stats,
      users: usersData.users ?? usersData,
      reports: reportsData.items ?? reportsData.reports ?? reportsData,
      analytics: { growth: [], plays: [], storageTrend: [] },
      auditLogs: auditData.actions ?? [],
      mostReported: mostReportedData
        ? {
            tracks: mostReportedData.most_reported_tracks ?? [],
            users: mostReportedData.most_reported_users ?? [],
          }
        : null,
    };
  },

  getUserById: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.user ?? res.data;
  },

  getReportById: async (reportId: string) => {
    const r = await api.get(`/admin/reports/${reportId}`);
    return r.data;
  },

  getAuditLog: async (page = 1, limit = 20) => {
    const r = await api.get('/admin/audit-log', { params: { page, limit } });
    const data = r.data;
    const actions: Record<string, unknown>[] = data.actions ?? [];
    type Nested = Record<string, string> | null;
    const items = actions.map((action) => ({
      id: String(action.id ?? ''),
      action_type: String(action.action_type ?? ''),
      admin_id: (action.admin as Nested)?.id ?? '',
      admin_name: (action.admin as Nested)?.display_name,
      admin_handle: (action.admin as Nested)?.handle,
      target_user_name: (action.target_user as Nested)?.display_name,
      target_user_handle: (action.target_user as Nested)?.handle,
      entity_type: (action.target_track
        ? 'TRACK'
        : action.target_user
        ? 'USER'
        : action.target_comment
        ? 'COMMENT'
        : action.target_playlist
        ? 'PLAYLIST'
        : undefined) as 'USER' | 'TRACK' | 'COMMENT' | 'PLAYLIST' | undefined,
      entity_id:
        (action.target_track as Nested)?.id ??
        (action.target_user as Nested)?.id ??
        (action.target_comment as Nested)?.id ??
        (action.target_playlist as Nested)?.id,
      notes: action.notes as string | null | undefined,
      created_at: String(action.created_at ?? ''),
    }));
    return {
      items,
      pagination: { totalPages: data.total_pages ?? 1 },
    };
  },

  getMostReported: async (period = 'last_30_days') => {
    const r = await api.get('/admin/stats/most-reported', { params: { period } });
    return r.data;
  },

  getDailyStats: async (dateFrom?: string, dateTo?: string) => {
    const r = await api.get('/admin/stats/daily', {
      params: { dateFrom, dateTo },
    });
    return r.data;
  },
  getReports: async () => {
    const r = await api.get('/admin/reports');
    return r.data.items ?? r.data.reports ?? r.data;
  },

  warnUser: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('warn', id, payload),

  suspendUser: async (
  id: string,
  payload: ActionPayload & {
    current_password: string;
  }
) => 
  adminServiceReal.submitAction('suspend', id, payload),

  banUser: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('ban', id, payload),

  restoreUser: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('restore', id, payload),

  updateReportStatus: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('report-status', id, payload),

  moderateTrack: async (id: string, payload: any) => 
    adminServiceReal.submitAction('track-mod', id, payload),

  moderateComment: async (id: string, payload: any) => 
    adminServiceReal.submitAction('comment-mod', id, payload),

  moderatePlaylist: async (id: string, payload: any) => 
    adminServiceReal.submitAction('playlist-mod', id, payload),

  // --- Core API Dispatcher ---

  submitAction: async (type: string, id: string, payload: ActionPayload) => {
    const password = payload.currentPassword ?? payload.current_password;
    switch (type) {
      case 'warn':
        return api.post(`/admin/users/${id}/warn`, {
          reason: payload.reason,
          currentPassword: password,
          reportId: payload.reportId,
        });
      case 'suspend':
        return api.post(`/admin/users/${id}/suspend`, {
          durationDays: payload.durationDays ?? payload.duration_days ?? 7,
          reason: payload.reason,
          currentPassword: password,
          reportId: payload.reportId,
        });
      case 'ban':
        return api.post(`/admin/users/${id}/ban`, {
          reason: payload.reason,
          currentPassword: password,
          reportId: payload.reportId,
        });
      case 'restore':
      case 'activate':
      case 'restore-user':
        return api.post(`/admin/users/${id}/restore`, {
          reason: payload.reason,
          restoreContent: payload.restoreContent ?? false,
        });
      case 'track-mod':
        return api.patch(`/admin/tracks/${id}/moderation`, {
          moderationState: payload.moderationState ?? payload.moderation_state,
          reason: payload.reason,
          reportId: payload.reportId,
        });
      case 'comment-mod':
        return api.patch(`/admin/comments/${id}/moderation`, {
          isHidden: (payload as unknown as Record<string, unknown>).isHidden,
          reason: payload.reason,
          reportId: payload.reportId,
        });
      case 'playlist-mod':
        return api.patch(`/admin/playlists/${id}/moderation`, {
          moderationState: payload.moderationState ?? payload.moderation_state,
          reason: payload.reason,
          reportId: payload.reportId,
        });
      case 'report-status':
        return api.patch(`/admin/reports/${id}`, payload);
      case 'report-assign':
        return api.patch(`/admin/reports/${id}/assign`, payload);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  },
  hideTrack: async (trackId: string, reason = 'Hidden by admin for policy violation') => {
    return api.patch(`/admin/tracks/${trackId}/moderation`, {
      moderationState: 'HIDDEN',
      reason,
    });
  },

  restoreTrack: async (trackId: string, reason = 'Restored by admin') => {
    return api.patch(`/admin/tracks/${trackId}/moderation`, {
      moderationState: 'VISIBLE',
      reason,
    });
  },

  addModeratorReview: async ({ reportId, content }: { reportId: string; content: string }) => {
    return api.patch(`/admin/reports/${reportId}`, { resolutionNotes: content });
  },

  bulkUpdateReports: async (reportIds: string[], status: string, resolutionNotes?: string) => {
    return api.patch('/admin/reports/bulk', { reportIds, status, resolutionNotes });
  },
};