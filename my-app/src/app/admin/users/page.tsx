"use client";

import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import api from '@/src/services/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminStore } from '@/src/store/useAdminStore';
import { RoleGuard } from '@/src/components/admin/RoleGuard';
import {
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiAlertTriangle,
  FiSlash
} from 'react-icons/fi';
import { ShieldAlert, ShieldCheck, Gavel } from 'lucide-react';
import { TablePagination } from '@/src/components/admin/TablePagination';

function UserManagementContent() {
  const { users = [], loadUsers, suspendUser, restoreUser, banUser, pagination } = useAdminStore();

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  // related to the pagination pages to stay at the current page
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get('page')) || 1;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    router.push(`?${params.toString()}`);
  };
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    mode: 'SUSPEND' | 'ACTIVATE' | 'BAN';
  }>({
    isOpen: false,
    userId: '',
    mode: 'SUSPEND'
  });

  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const [checkingPasswordStatus, setCheckingPasswordStatus] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupStatus, setSetupStatus] = useState('');

  const openConfirmModal = (userId: string, mode: 'SUSPEND' | 'ACTIVATE' | 'BAN') => {
    setError('');
    setRequiresPasswordSetup(false);
    setSetupStatus('');
    setCheckingPasswordStatus(mode !== 'ACTIVATE');
    setConfirmModal({ isOpen: true, userId, mode });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    loadUsers(1);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const closeModal = () => {
    setConfirmModal({ isOpen: false, userId: '', mode: 'SUSPEND' });
    setReason('');
    setPassword('');
    setError('');
    setRequiresPasswordSetup(false);
    setSetupPassword('');
    setSetupConfirmPassword('');
    setSetupStatus('');
    setCheckingPasswordStatus(false);
  };

  useEffect(() => {
    const shouldCheck = confirmModal.isOpen && confirmModal.mode !== 'ACTIVATE';
    if (!shouldCheck) return;

    let cancelled = false;

    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const hasPassword = Boolean(res?.data?.hasPassword ?? res?.data?.has_password);
        setRequiresPasswordSetup(!hasPassword);
      })
      .catch(() => {
        if (cancelled) return;
        setRequiresPasswordSetup(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingPasswordStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [confirmModal.isOpen, confirmModal.mode]);

  if (!isMounted) return null;

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || user.system_role === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  const setupLocalAdminPassword = async () => {
    if (!setupPassword || !setupConfirmPassword) {
      setSetupStatus('Please fill both password fields.');
      return;
    }

    try {
      setSetupStatus('');
      await api.post('/auth/change-password', {
        new_password: setupPassword,
        new_password_confirm: setupConfirmPassword,
      });
      setSetupPassword('');
      setSetupConfirmPassword('');
      setRequiresPasswordSetup(false);
      setSetupStatus('Password set successfully. Please enter it above and confirm the action.');
    } catch (err) {
      const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setSetupStatus(errorData?.message || 'Failed to set admin password.');
    }
  };

  const executeAction = async () => {
    if (checkingPasswordStatus) {
      setError('Checking password status, please wait.');
      return;
    }

    if (requiresPasswordSetup) {
      setError('Please set a local admin password first.');
      return;
    }

    if (!reason || (confirmModal.mode !== 'ACTIVATE' && !password)) {
      setError("Missing required fields.");
      return;
    }

    try {
      setError('');

      const payload = { reason, current_password: password };

      if (confirmModal.mode === 'SUSPEND') {
        await suspendUser(confirmModal.userId, { ...payload, duration_days: 7 });
      } else if (confirmModal.mode === 'BAN') {
        await banUser(confirmModal.userId, payload);
      } else {
        await restoreUser(confirmModal.userId, reason);
      }

      await loadUsers();
      closeModal();
    } catch (err) {
      const errorData = (err as {
        response?: { data?: { error?: string; code?: string; message?: string } };
      })
        ?.response?.data;
      if (errorData?.error === 'PASSWORD_SETUP_REQUIRED' || errorData?.code === 'PASSWORD_SETUP_REQUIRED') {
        setRequiresPasswordSetup(true);
        setError(
          errorData.message ||
            'Your account was created with Google. Please set a local admin password before performing sensitive admin actions.',
        );
        return;
      }
      setError(errorData?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-zinc-500 text-sm">
            Monitor community members and artist credentials
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'User', 'Admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                roleFilter === role
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Flags</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/20 group transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold border border-zinc-700 uppercase">
                      {user.display_name?.[0]}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        {user.display_name}
                        {user.is_verified && <FiUserCheck className="text-blue-400" size={14} />}
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      user.account_status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {user.account_status}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md w-fit">
                    <FiAlertTriangle size={12} />
                    <span className="text-xs font-bold">
                      {user.report_count || 0}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-xs text-zinc-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/users/${user.id}?page=${currentPage}`} className="p-2 hover:bg-zinc-800 text-zinc-500 rounded-lg transition-colors">
                      <FiEye size={16} />
                    </Link>

                    <RoleGuard action="SUSPEND_USER">
                      <button
                        onClick={() =>
                          openConfirmModal(
                            user.id,
                            user.account_status === 'ACTIVE'
                              ? 'SUSPEND'
                              : 'ACTIVATE',
                          )
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          user.account_status === 'ACTIVE'
                            ? 'hover:text-red-500'
                            : 'hover:text-green-500'
                        } text-zinc-500`}
                      >
                        {user.account_status === 'ACTIVE' ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                      </button>

                      {user.account_status !== 'BANNED' && (
                        <button
                          onClick={() => openConfirmModal(user.id, 'BAN')}
                          className="p-2 hover:text-red-600 text-zinc-500 rounded-lg transition-colors"
                        >
                          <FiSlash size={16} />
                        </button>
                      )}
                    </RoleGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => loadUsers(page)}
        />
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl max-w-md w-full animate-in zoom-in-95">

            {/* ERROR DISPLAY */}
            {error && (
              <div className="bg-red-500/10 text-red-500 text-sm px-3 py-2 rounded-lg border border-red-500/20 mb-4">
                {error}
              </div>
            )}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
              confirmModal.mode === 'ACTIVATE'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {confirmModal.mode === 'BAN'
                ? <Gavel size={32} />
                : confirmModal.mode === 'ACTIVATE'
                ? <ShieldCheck size={32} />
                : <ShieldAlert size={32} />}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {confirmModal.mode === 'BAN'
                ? 'Permanent Ban?'
                : confirmModal.mode === 'ACTIVATE'
                ? 'Restore Account?'
                : 'Suspend Account?'}
            </h2>

            <p className="text-zinc-400 text-sm mb-6">
              {confirmModal.mode === 'BAN'
                ? 'This user will be permanently blocked from the platform.'
                : 'Please provide a justification for this action.'}
            </p>

            <div className="space-y-4">
              <textarea
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Reason..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
              />

              {requiresPasswordSetup && confirmModal.mode !== 'ACTIVATE' && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 space-y-3">
                  <p className="text-sm text-orange-200">
                    Your Google account needs a local admin password before sensitive actions.
                  </p>
                  <input
                    type="password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="New local password"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="Confirm new password"
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  />
                  {setupStatus && <p className="text-xs text-zinc-300">{setupStatus}</p>}
                  <button
                    type="button"
                    onClick={setupLocalAdminPassword}
                    className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-colors"
                  >
                    Set Local Password
                  </button>
                </div>
              )}

              {confirmModal.mode !== 'ACTIVATE' && (
                <input
                  type="password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Admin Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={executeAction}
                  disabled={checkingPasswordStatus || requiresPasswordSetup}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                    confirmModal.mode === 'ACTIVATE'
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-red-600 hover:bg-red-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {checkingPasswordStatus ? 'Checking...' : 'Confirm'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="p-10 text-zinc-500 animate-pulse">Loading...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}