import { AdminUser } from "@/src/types/admin";

export type PermissionAction =
  | 'VIEW_REPORTS'
  | 'RESOLVE_REPORT'
  | 'REJECT_REPORT'
  | 'WARN_USER'
  | 'SUSPEND_USER'
  | 'BAN_USER'
  | 'REACTIVATE_USER'
  | 'DELETE_TRACK'
  | 'HIDE_TRACK'
  | 'DELETE_COMMENT';

const ROLE_PERMISSIONS: Record<AdminUser['system_role'], PermissionAction[]> = {
  ADMIN: [
    'VIEW_REPORTS',
    'RESOLVE_REPORT',
    'REJECT_REPORT',
    'WARN_USER',
    'SUSPEND_USER',
    'BAN_USER',
    'REACTIVATE_USER',
    'DELETE_TRACK',
    'HIDE_TRACK',
    'DELETE_COMMENT',
  ],
  MODERATOR: [
    'VIEW_REPORTS',
    'RESOLVE_REPORT',
    'REJECT_REPORT',
    'HIDE_TRACK',
    'DELETE_COMMENT',
  ],
  USER: [],
};

export const canPerform = (user: AdminUser | null, action: PermissionAction) =>
  !!user && ROLE_PERMISSIONS[user.system_role]?.includes(action);