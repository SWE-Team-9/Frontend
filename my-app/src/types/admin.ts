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
export interface ModerationAction {
  id: string;
  admin_id: string;
  action_type: 'WARN' | 'SUSPEND' | 'BAN' | 'RESTORE' | 'HIDE' | 'DELETE';
  reason: string;
  created_at: string;
  metadata?: Record<string, string | number | boolean>;
}
export interface ModeratorReview {
  id: string;
  content: string;
  created_at?: string;
  admin_name?: string;
  
}


export interface Report {
  id: string;
  reporter: { id: string; display_name: string; handle: string };
  description: string;
  target: {
    type: 'TRACK' | 'USER' | 'COMMENT' ;
    id: string;
    title: string;
    owner_handle?: string;
  };
  offender: {
    id: string;
    account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  };
  category: 'COPYRIGHT' | 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW';
  created_at: string;
  assigned_to?: string | null; // Admin ID of who is handling the report
  assigned_admin?: { id: string; handle: string; display_name: string } | null; // Populated when fetching reports with admin details
  moderator_reviews?: ModeratorReview[]; // Reviews left by moderators during the review process
  previous_actions_on_target?: ModerationAction[]; // This can be populated with the history of actions taken on the reported content/user for better context during review
}


export interface PaginatedAuditLogs {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  actions: AuditLog[]; // Matches the "actions" key in your JSON
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
export interface DailyStat {
  date: string;
  users_total: number;
  tracks_total: number;
  plays_total: number;
  storage_used: number;
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

  
  engagement: {
    total_play_events: number;
    completed_play_events: number;
    play_through_rate_pct: number;
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
  duration_hours?: number;
  action?: string;
  restoreContent?: boolean;
  moderation_state?: string;
  moderator_reviews?: string;
  status?: 'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW'| 'PENDING';
  reportId?: string;
  assigned_to?: string;
};