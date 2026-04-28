export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  reason: string;
  created_at: string;
}

export interface MostReportedStats {
  tracks: { id: string; title: string; report_count: number }[];
  users: { id: string; display_name: string; report_count: number }[];
}

export interface Report {
  id: string;
  reporter: { id: string; display_name: string; handle: string };
  target: {
    type: 'TRACK' | 'USER' | 'COMMENT' | 'PLAYLIST';
    id: string;
    title: string;
    owner_handle?: string;
  };
  category: 'COPYRIGHT' | 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  created_at: string;
}

export interface AdminUser {
  id: string;
  display_name: string;
  handle: string;
  email: string;
  system_role: 'ADMIN' | 'MODERATOR' | 'USER';
  account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  is_verified: boolean;
  created_at: string;
  avatar_url: string | null;
  account_type: 'FREE' | 'PRO' | 'ENTERPRISE';
  track_count: number;
  report_count: number;
  last_login_at: string;
      
}
export interface PaginatedUsers {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  users: AdminUser[];
}

export interface AnalyticsData {
  growth: { date: string; users: number; artists: number }[];
  plays: { name: string; value: number }[];
  storageTrend: { month: string; used: number }[];
}
export interface AdminStats {
  users: {
    total: number;
    listeners: number;
    artists: number;
    active: number;
    suspended: number;
    banned: number;
  };

  storage: {
    used_bytes: number;
    total_bytes: number;
    total_human_readable: string;
  };

  content: {
    total_tracks: number;
    tracks_visible: number;
  };

  moderation: {
    reports_pending: number;
  };

  genres?: {
    name: string;
    value: number;
    color: string;
  }[];
}
export type ActionPayload = {
  reason?: string;
  current_password?: string;
  duration_days?: number;
  moderation_state?: string;
  status?: 'RESOLVED' | 'REJECTED';
};