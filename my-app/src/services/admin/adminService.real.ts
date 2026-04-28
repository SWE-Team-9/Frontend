import axios from "axios";



const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true
});
type ActionPayload = {
reason?: string;
current_password?: string;
duration_days?: number;
moderation_state?: string;
status?: 'RESOLVED' | 'REJECTED';
};



export const adminServiceReal = {
  getInitialData: async () => {
    const [stats, users, reports] = await Promise.all([
      api.get('/admin/stats/overview').then(r => r.data),
      api.get('/admin/users').then(r => r.data),
      api.get('/admin/reports').then(r => r.data),
    ]);

    return {
      stats,
      users: users.users ?? users,
      reports: reports.reports ?? reports,
      analytics: { growth: [], plays: [], storageTrend: [] },
      auditLogs: [],
      mostReported: null
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

  submitAction: async (type: string, id: string, payload: ActionPayload) => {
    switch (type) {
      case 'warn': return api.post(`/admin/users/${id}/warn`, payload);
      case 'suspend': return api.post(`/admin/users/${id}/suspend`, payload);
      case 'ban': return api.post(`/admin/users/${id}/ban`, payload);
      case 'restore-user': return api.post(`/admin/users/${id}/restore`, payload);
      case 'track-mod': return api.patch(`/admin/tracks/${id}/moderation`, payload);
      case 'report-status': return api.patch(`/admin/reports/${id}`, payload);
      default: throw new Error("Unknown action type");
    }
  }
};