import { ActionPayload } from "@/src/types/admin";

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
        users: { total: 12450, active: 11800, suspended: 42, banned: 108, verified: 11200, unverified: 1250 },
        content: { total_tracks: 45000, total_playlists: 8200, total_comments: 156000 },
        storage: {
          total_bytes: 5368709120000,
          used_bytes: 3221225472000,
          total_human_readable: "5.0 TB"
        },
        moderation: { reports_pending: 23, reports_in_review: 5, reports_resolved_this_week: 41 }
      },
      users: mockUsersState,
      reports: mockReportsState,
      analytics: { growth: [], plays: [], storageTrend: [] },
      auditLogs: [],
      mostReported: null
    };
  },

  getUserById: async (id: string) => {
    await delay(200);
    return mockUsersState.find(u => u.id === id) || null;
  },

  getReportById: async (reportId: string) => {
    await delay(400);
    return mockReportsState.find(r => r.id === reportId) || null;
  },

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