"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/src/services/admin/adminService';
import { FiArrowLeft, FiShield, FiClock, FiFlag } from 'react-icons/fi'; // Removed FiBarChart2
import { Music, Users, Calendar, Crown } from 'lucide-react';
import { AdminUser, ModerationAction } from '@/src/types/admin'; // Import your types

// Extend AdminUser if the Detail page has extra fields like stats or subscription
interface UserDetail extends AdminUser {
  subscription?: {
    tier: string;
    status: string;
    current_period_end: string;
  };
  stats?: {
    tracks_uploaded: number;
    followers_count: number;
  };
  reports_against?: {
    total: number;
  };
  moderation_history?: Array<ModerationAction & { notes?: string, admin_handle?: string }>;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // FIXED: Replaced <any> with <UserDetail | null>
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await adminService.getUserById(id as string);
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="p-10 text-zinc-500 animate-pulse">Loading profile...</div>;
  if (!user) return <div className="p-10 text-white">User not found.</div>;

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-500">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
        <FiArrowLeft /> <span>Back to Management</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-zinc-800 flex items-center justify-center text-4xl font-bold text-zinc-600 border border-zinc-700 uppercase">
            {user.display_name?.[0] || '?'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{user.display_name}</h1>
              {user.subscription?.tier === 'PRO' && (
                <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black border border-orange-500/20 tracking-widest uppercase flex items-center gap-1">
                  <Crown size={10}/> PRO
                </span>
              )}
            </div>
            <p className="text-zinc-500"> {user.email}</p>
            <div className="flex gap-2 mt-4">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${user.account_status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {user.account_status}
              </span>
              <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                {user.system_role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tracks', val: user.stats?.tracks_uploaded || 0, icon: Music },
          { label: 'Followers', val: user.stats?.followers_count || 0, icon: Users },
          { label: 'Reports Against', val: user.reports_against?.total || 0, icon: FiFlag, color: 'text-red-500' },
          { label: 'Member Since', val: user.created_at ? new Date(user.created_at).getFullYear() : 'N/A', icon: Calendar },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
            <s.icon className={`mb-3 ${s.color || 'text-zinc-500'}`} size={20} />
            <p className="text-2xl font-bold text-white">{s.val}</p>
            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Moderation History */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FiClock className="text-orange-500" /> Moderation Log
          </h3>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
            {user.moderation_history && user.moderation_history.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {user.moderation_history.map((log) => (
                  <div key={log.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-white">{log.action_type.replace('_', ' ')}</p>
                      <p className="text-xs text-zinc-500">{log.notes || log.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">By @{log.admin_handle || 'system'}</p>
                      <p className="text-[10px] text-zinc-600">{new Date(log.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-zinc-600 text-sm italic">No history found.</div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FiShield className="text-blue-500" /> Subscription
          </h3>
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Current Tier</p>
              <p className="text-xl font-bold text-white">{user.subscription?.tier || 'FREE'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Status</p>
              <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                {user.subscription?.status || 'INACTIVE'}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Renewal Date</p>
              <p className="text-sm text-zinc-300">
                {user.subscription?.current_period_end 
                  ? new Date(user.subscription.current_period_end).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}