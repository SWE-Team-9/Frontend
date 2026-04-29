"use client";

import React, { useEffect, useState } from 'react';
import { useAdminStore } from '@/src/store/useAdminStore';
import { RoleGuard } from '@/src/components/admin/RoleGuard';
import {
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiFlag,
  FiAlertTriangle
} from 'react-icons/fi';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function UserManagementPage() {
  const { users = [], reports = [], suspendUser, fetchDashboardData } = useAdminStore();

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    mode: 'SUSPEND' | 'ACTIVATE';
  }>({
    isOpen: false,
    userId: '',
    mode: 'SUSPEND'
  });

  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    fetchDashboardData();
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  if (!isMounted) return null;

  const filteredUsers = users.filter(user => {
    const nameMatch = user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === 'All' || user.system_role === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const handleActionTrigger = (userId: string, currentStatus: string) => {
    setConfirmModal({
      isOpen: true,
      userId,
      mode: currentStatus === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'
    });
  };

  const executeAction = async () => {
    if (!reason || !password) {
      alert("Please provide both a reason and your password.");
      return;
    }

    try {
      // Use 7 days for suspension, 0 for restoration
      const duration = confirmModal.mode === 'SUSPEND' ? 7 : 0;

      await suspendUser(confirmModal.userId, duration, {
        reason,
        current_password: password
      });

      await fetchDashboardData();

      setConfirmModal({ isOpen: false, userId: '', mode: 'SUSPEND' });
      setReason('');
      setPassword('');
      alert("User status updated successfully.");
    } catch (_error) {
      alert("Action failed. Please check your credentials or network.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-zinc-500 text-sm">Monitor community members and artist credentials</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'User', 'Admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                roleFilter === role
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Flags</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredUsers.map((user) => {
              const userReportCount = reports.filter((r) => {
                const matchesUser = r.target.type === 'USER' && r.target.id === user.id;
                const matchesOwner = r.target.owner_handle?.toLowerCase() === user.handle?.toLowerCase();
                const isActiveReport = r.status === 'PENDING' || 'IN_REVIEW';

                return (matchesUser || matchesOwner) && isActiveReport;
              }).length;

              return (
                <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold border border-zinc-700">
                        {user.display_name?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{user.display_name}</span>
                          {user.is_verified && <FiUserCheck className="text-blue-400" size={14} />}
                        </div>
                        <span className="text-xs text-zinc-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      user.account_status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {user.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {userReportCount > 0 ? (
                      <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md w-fit">
                        <FiAlertTriangle size={12} />
                        <span className="text-xs font-bold">{userReportCount}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RoleGuard
                        action="SUSPEND_USER"
                        fallback={<span className="text-[10px] text-zinc-600 self-center px-2">View Only</span>}
                      >
                        <button
                          onClick={() => handleActionTrigger(user.id, user.account_status)}
                          className={`p-2 rounded-lg transition-all ${
                            user.account_status === 'ACTIVE' ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500'
                          } text-zinc-500`}
                        >
                          {user.account_status === 'ACTIVE' ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                        </button>
                      </RoleGuard>

                      <button className="p-2 hover:bg-zinc-700 text-zinc-500 rounded-lg transition-all">
                        <FiFlag size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-20 text-center text-zinc-600 italic">No users found.</div>
        )}
      </div>

      {/* DUAL MODE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
              confirmModal.mode === 'SUSPEND' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
            }`}>
              {confirmModal.mode === 'SUSPEND' ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {confirmModal.mode === 'SUSPEND' ? 'Suspend Account?' : 'Restore Account?'}
            </h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              {confirmModal.mode === 'SUSPEND'
                ? "This will restrict access for 7 days. Violation emails will be dispatched automatically."
                : "Full access will be restored immediately."}
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-widest">Reason</label>
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Provide justification..."
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-widest">Admin Password</label>
                <input
                  type="password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                    confirmModal.mode === 'SUSPEND'
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                      : 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
                  }`}
                >
                  {confirmModal.mode === 'SUSPEND' ? 'Confirm Suspension' : 'Confirm Restoration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}