"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminStore } from '@/src/store/useAdminStore';
import { RoleGuard } from '@/src/components/admin/RoleGuard';
import { 
  FiCheckCircle, 
  FiTrash2, 
  FiAlertCircle,
  FiEye
} from 'react-icons/fi';
import { Music, User, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const { 
    reports = [], 
    updateReportStatus, 
    suspendUser, 
    users = [], 
    fetchDashboardData 
  } = useAdminStore();
  
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [isMounted, setIsMounted] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; 
    userId: string; 
    mode: 'SUSPEND' | 'ACTIVATE'
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

  const handleAction = (userId: string, status: string) => {
    setConfirmModal({ 
      isOpen: true, 
      userId, 
      mode: status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE' 
    });
  };

  const executeAction = async () => {
    if (!reason || !password) return alert("Required fields missing");
    
    try {
      const duration = confirmModal.mode === 'SUSPEND' ? 7 : 0;
      
      await suspendUser(confirmModal.userId, duration, { 
        reason, 
        current_password: password 
      });
      await fetchDashboardData();

      setConfirmModal({ isOpen: false, userId: '', mode: 'SUSPEND' });
      setReason('');
      setPassword('');
    } catch (_error) {
      alert("Failed to update status. Check your admin password.");
    }
  };

  const filteredReports = reports.filter(r => 
    filter === 'ALL' ? true : r.status === filter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Reports</h1>
          <p className="text-zinc-500 text-sm">Review and act on community flags</p>
        </div>
        
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          {(['ALL', 'PENDING', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === tab ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Target Content</th>
              <th className="px-6 py-4">Offender Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredReports.map((report) => {
              if (!report?.target) return null;

              const offender = users.find(u => {
                const isUserReport = report.target.type === 'USER';
                if (isUserReport) {
                  return String(u.id) === String(report.target.id);
                }
                const targetHandle = report.target.owner_handle?.toLowerCase().replace('@', '');
                const userHandle = u.handle?.toLowerCase().replace('@', '');
                return targetHandle && userHandle === targetHandle;
              });

              return (
                <tr key={report.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{report.reporter?.display_name || 'Unknown'}</span>
                      <span className="text-[10px] text-zinc-500">@{report.reporter?.handle || 'anonymous'}</span>
                      <span className={`text-[10px] font-bold uppercase mt-2 flex items-center gap-1 ${
                        report.category === 'COPYRIGHT' ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        <FiAlertCircle size={10} />
                        {report.category}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
                        {report.target.type === 'TRACK' ? <Music size={14} className="text-zinc-400" /> : <User size={14} className="text-zinc-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-300 font-medium">{report.target.title}</span>
                        <span className="text-[10px] text-zinc-600 uppercase tracking-tight">
                          {report.target.type} • {report.target.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {offender ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${offender.account_status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold uppercase text-zinc-400">{offender.account_status}</span>
                        
                        <RoleGuard action="SUSPEND_USER" fallback={<span className="text-[10px] text-zinc-600 px-2">View Only</span>}>
                          <button 
                            onClick={() => handleAction(offender.id, offender.account_status)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-all font-black ${
                              offender.account_status === 'ACTIVE' 
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' 
                                : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            {offender.account_status === 'ACTIVE' ? 'SUSPEND' : 'RESTORE'}
                          </button>
                        </RoleGuard>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[10px] italic">No Target User Linked</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/reports/${report.id}`}
                        title="View Report Details"
                        className="p-2 hover:bg-orange-500/10 hover:text-orange-500 rounded-lg text-zinc-500 transition-colors"
                      >
                        <FiEye size={18} />
                      </Link>
                      <RoleGuard action="RESOLVE_REPORT">
                        <button 
                          title="Mark as Resolved"
                          onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                          className="p-2 hover:bg-green-500/10 hover:text-green-500 rounded-lg text-zinc-500 transition-colors"
                        >
                          <FiCheckCircle size={18} />
                        </button>
                        <button 
                          title="Reject Report"
                          onClick={() => updateReportStatus(report.id, 'REJECTED')}
                          className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-zinc-500 transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </RoleGuard>
                    </div>
                  </td>
                  
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                ? "This restricts access for 7 days. Violation alerts will be logged."
                : "Full system access will be granted to the user immediately."}
            </p>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-widest">Reason</label>
                <textarea 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Justify this action..."
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
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}