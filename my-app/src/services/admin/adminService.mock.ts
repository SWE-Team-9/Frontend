import { ActionPayload, Report, } from "@/src/types/admin";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Mock Data States ---

let mockUsersState = [
  {
    id: 'u-101',
    display_name: 'Ahmed Hassan',
    handle: 'ahmed-hassan',
    email: 'ahmed@example.com',
    system_role: 'USER',
    account_status: 'SUSPENDED',
    is_verified: true,
    track_count: 15,
    report_count: 5,
    created_at: '2026-01-15T08:00:00Z'
  },
  {
    id: 'u-102',
    display_name: 'Salma Vocals',
    handle: 'salma-vocals',
    email: 'salma@example.com',
    system_role: 'USER',
    account_status: 'ACTIVE',
    is_verified: false,
    track_count: 5,
    report_count: 2,
    created_at: '2026-02-20T12:30:00Z'
  }
];

let mockReportsState = [
  {
    id: 'rep-9901',
    category: 'COPYRIGHT',
    status: 'PENDING',
    created_at: '2026-03-07T10:00:00Z',
    reporter: { display_name: 'Salma Vocals', handle: 'salma-vocals' },
    target: {
      type: 'TRACK',
      id: 'tr-505',
      title: 'Ya Ana',
      owner_handle: 'ahmed-hassan'
    }
  },
  {
    id: 'rep-9902',
    category: 'HARASSMENT',
    status: 'IN_REVIEW',
    created_at: '2026-03-07T11:30:00Z',
    reporter: { display_name: 'Omar_99', handle: 'omar-music' },
    target: {
      type: 'TRACK',
      id: 'tr-10',
      title: 'TrollAccount',
      owner_handle: 'salma-vocals'
    }
  }
];

// --- Mock Service ---

export const adminServiceMock = {
  getInitialData: async () => {
    await delay(800);

    return {
      stats: {
        users: { total: 12450, active: 11800, suspended: 42, banned: 108, verified: 11200, unverified: 1250, artists: 2600, listeners: 9850 },
        content: { total_tracks: 45000, tracks_visible: 44000, total_playlists: 8200, total_comments: 156000 },
        storage: {
          total_bytes: 5368709120000,
          used_bytes: 3221225472000,
          total_human_readable: "5.0 TB"
        },
        moderation: { reports_pending: 23, reports_in_review: 5, reports_resolved_this_week: 41 },
        engagement: { total_play_events: 0, completed_play_events: 0, play_through_rate_pct: 0 }
      },
      users: mockUsersState,
      reports: mockReportsState,
      totalStorage:203,
      analytics: { growth: [], plays: [], storageTrend: [] },
      auditLogs: [],
      mostReported: null
    };
  },

  getUserById: async (id: string) => {
    await delay(200);
    return mockUsersState.find(u => u.id === id) || null;
  },
  getUsersPaginated: async (page: number, limit: number) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const total = mockUsersState.length;
    const total_pages = Math.ceil(total / limit);
    
    // Calculate start and end indices for slicing
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = mockUsersState.slice(start, end);

    return {
      page,
      limit,
      total,
      total_pages,
      users: paginatedUsers,
    };
  },
  getReportsPaginated: async (page: number, limit: number) => {
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    const total = mockReportsState.length;
    const total_pages = Math.ceil(total / limit);
    
    // Calculate start and end indices for slicing
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = mockReportsState.slice(start, end);

    return {
      page,
      limit,
      total,
      total_pages,
      users: paginatedUsers,
    };
  },
  getDailyStats: async (dateFrom?: string, dateTo?: string) => {
  // simulate 30 days
  const days = 30;

  const metrics = Array.from({ length: days }).map((_, i) => ({
    date: `2026-04-${String(i + 1).padStart(2, "0")}`,
    new_users: 20 + i * 2,
    tracks_uploaded: 40 + i * 3,
    total_storage_bytes: 120_000_000_000 + i * 2_000_000_000,
    active_subscribers: 300 + i * 2,
  }));

  return {
    metrics,
    date_from: dateFrom,
    date_to: dateTo,
  };
},
  

  getReportById: async (reportId: string) => {
    await delay(400);
    return mockReportsState.find(r => r.id === reportId) || null;
  },
  warnUser: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('warn', id, payload),

  suspendUser: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('suspend', id, payload),

  banUser: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('ban', id, payload),

  restoreUser: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('restore', id, payload),

  updateReportStatus: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('report-status', id, payload),

  moderateTrack: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('track-mod', id, payload),

  moderateComment: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('comment-mod', id, payload),

  moderatePlaylist: async (id: string, payload: ActionPayload) => 
    adminServiceMock.submitAction('playlist-mod', id, payload),

  
  getReports: async () => {
    await delay(300);
    return { reports: mockReportsState };
  },
  addModeratorReview: async () => {},
  hideTrack: async () => {},
  restoreTrack: async () => {},

  submitAction: async (
    type: string,
    id: string,
    payload: ActionPayload
  ) => {
    await delay(500);

    // Update Users
    if (type === 'suspend' || type === 'activate') {
      mockUsersState = mockUsersState.map(u =>
        u.id === id
          ? {
              ...u,
              account_status: type === 'suspend' ? 'SUSPENDED' : 'ACTIVE'
            }
          : u
      );
    }

    if (type === 'ban') {
      mockUsersState = mockUsersState.map(u => 
        u.id === id ? { ...u, account_status: 'BANNED' } : u
      );
    }

    // Update Reports
    if (type === 'report-status' && payload.status) {
      mockReportsState = mockReportsState.map(r =>
        r.id === id ? { ...r, status: payload.status! } : r
      );
    }

    console.log(`[MOCK ACTION: ${type}]`, id, payload);
    return { success: true };
  }
};