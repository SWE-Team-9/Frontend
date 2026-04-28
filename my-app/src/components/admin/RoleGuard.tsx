"use client";
import React from 'react';
import { useAdminStore } from '@/src/store/useAdminStore';
import { canPerform } from './permissions';

interface RoleGuardProps {
  action: 'VIEW_REPORTS'
  | 'RESOLVE_REPORT'
  | 'REJECT_REPORT'
  | 'WARN_USER'
  | 'SUSPEND_USER'
  | 'BAN_USER';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ action, children, fallback = null }: RoleGuardProps) => {
  
  const user = useAdminStore((s) => s.currentUser);

  if (!canPerform(user, action)) {
  return fallback ?? null;
}

  return <>{children}</>;
};


