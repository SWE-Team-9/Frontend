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
    const [rawStats, usersData, reportsData, auditData, mostReportedData,dailyData] =
      await Promise.all([
        api.get('/admin/stats/overview').then(r => r.data),
        api.get('/admin/users').then(r => r.data),
        api.get('/admin/reports').then(r => r.data),
        api.get('/admin/audit-log').then(r => r.data).catch(() => ({ items: [] })),
        api.get('/admin/stats/most-reported').then(r => r.data).catch(() => null),
        api.get('/admin/stats/daily', { params: { granularity: 'monthly' } }).then(r => r.data),
      ]);

    const stats = transformOverviewStats(rawStats);
    const storageTrend = (dailyData.metrics || []).map((m: { 
    date: string; 
    total_storage_bytes: number; 
    new_users: number; 
    tracks_uploaded: number 
  }) => ({
    date: m.date,
    value: m.total_storage_bytes,
    newUsers: m.new_users,
    tracks: m.tracks_uploaded
  }));
  return {
    stats,
    users: usersData.users ?? usersData,
    reports: reportsData.items ?? reportsData.reports ?? reportsData,
    analytics: { 
      growth: storageTrend, // Use the same data for growth charts
      plays: [], 
      storageTrend: storageTrend 
    },
    auditLogs: auditData.items ?? [],
    mostReported: mostReportedData ? {
      tracks: mostReportedData.mostReportedTracks ?? mostReportedData.tracks ?? [],
      users: mostReportedData.mostReportedUsers ?? mostReportedData.users ?? [],
    } : null,
  };
},


  getUserById: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.user ?? res.data;
  },

  getUsersPaginated: async (page: number, limit: number) => {
    const response = await api.get(`/admin/users`, { 
      params: { page, limit } 
    });
    return response.data; // Return the raw data structure you shared
  },

  getReportById: async (reportId: string) => {
    const r = await api.get(`/admin/reports/${reportId}`);
    return r.data;
  },
  getReportsPaginated: async (page: number, limit: number) => {
  const response = await api.get(`/admin/reports`, { 
    params: { page, limit } 
  });
  return response.data; 
},

  getAuditLog: async (page = 1, limit = 20) => {
    const r = await api.get('/admin/audit-log', { params: { page, limit } });
    return r.data;
  },

  getMostReported: async (period = 'last_30_days') => {
    const r = await api.get('/admin/stats/most-reported', { params: { period } });
    return r.data;
  },

  getDailyStats: async (dateFrom?: string, dateTo?: string) => {
  const r = await api.get('/admin/stats/daily', {
    params: { dateFrom, dateTo },
  });

  return {
    metrics: r.data.metrics ?? [],
    date_from: r.data.date_from,
    date_to: r.data.date_to,
  };
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

  moderateTrack: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('track-mod', id, payload),

  moderateComment: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('comment-mod', id, payload),

  moderatePlaylist: async (id: string, payload: ActionPayload) => 
    adminServiceReal.submitAction('playlist-mod', id, payload),

  // --- Core API Dispatcher ---

  submitAction: async (type: string, id: string, payload: ActionPayload) => {
    switch (type) {
      case 'warn': 
        return api.post(`/admin/users/${id}/warn`, payload);
      case 'suspend': 
        return api.post(`/admin/users/${id}/suspend`, {
         ...payload,
         durationHours:
         payload.duration_hours ??
         (payload.duration_days ?? 7) * 24,
         current_password: payload.current_password,
     });
      case 'ban': 
        return api.post(`/admin/users/${id}/ban`, payload);
      case 'restore':
      case 'activate':
      case 'restore-user': 
        return api.post(`/admin/users/${id}/restore`, payload);
      case 'track-mod': 
        return api.patch(`/admin/tracks/${id}/moderation`, payload);
      case 'comment-mod': 
        return api.patch(`/admin/comments/${id}/moderation`, payload);
      case 'playlist-mod': 
        return api.patch(`/admin/playlists/${id}/moderation`, payload);
      case 'report-status': 
        return api.patch(`/admin/reports/${id}`, payload);
      case 'report-assign': 
        return api.patch(`/admin/reports/${id}/assign`, payload);
      default: 
        throw new Error(`Unknown action type: ${type}`);
    }
  },
  //real APIs to be used for moderation actions and report status updates
  hideTrack: async (trackId: string) => {
    await fetch(`/api/v1/admin/tracks/${trackId}/hide`, {
      method: "POST",
    });
  },

  restoreTrack: async (trackId: string) => {
    await fetch(`/api/v1/admin/tracks/${trackId}/restore`, {
      method: "POST",
    });
  },

  addModeratorReview: async ({ reportId , content }:  { reportId: string; content: string }) => {
    await fetch(`/api/v1/admin/reports/${reportId}/review`, {
      method: "POST",
      body: JSON.stringify({ content }),
      headers: { "Content-Type": "application/json" },
    });
  },

  bulkUpdateReports: async (reportIds: string[], status: string, resolutionNotes?: string) => {
    return api.patch('/admin/reports/bulk', { reportIds, status, resolutionNotes });
  },
};