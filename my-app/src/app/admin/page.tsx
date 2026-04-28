"use client";
import React, { useEffect } from 'react';
import { useAdminStore } from '@/src/store/useAdminStore';
import { StatCard } from '@/src/components/admin/StatCard';
import { 
  Users, 
  HardDrive, 
  Music, 
  AlertCircle, 
  TrendingUp,
  RefreshCcw,
  Disc,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer, 
  Tooltip
} from 'recharts';

export default function AdminDashboard() {
  const { stats, fetchDashboardData, isLoading } = useAdminStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
      </div>
    );
  }

  // Data Preparation
  const userRatioData = [
    { name: 'Listeners', value: stats.users.listeners || 0, color: '#f97316' },
    { name: 'Artists', value: stats.users.artists || 0, color: '#3f3f46' }
  ];

  const userDistributionData = [
    { name: 'Active', value: stats.users.active, color: '#f97316' },
    { name: 'Listeners', value: stats.users.listeners, color: '#a1a1aa' },
    { name: 'Artists', value: stats.users.artists, color: '#6366f1' },
    { name: 'Suspended', value: stats.users.suspended, color: '#eab308' },
    { name: 'Banned', value: stats.users.banned, color: '#ef4444' },
  ];

  const genreData = stats.genres || [
    { name: 'Electronic', value: 45, color: '#f97316' },
    { name: 'Hip-hop', value: 25, color: '#a1a1aa' },
    { name: 'Rock', value: 15, color: '#71717a' },
    { name: 'Lo-fi', value: 10, color: '#3f3f46' },
    { name: 'Other', value: 5, color: '#27272a' },
  ];

  const storagePercent = (stats.storage.used_bytes / stats.storage.total_bytes) * 100;
  
  const getStorageColor = (percent: number) => {
    if (percent > 90) return '#ef4444';
    if (percent > 75) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Platform overview and real-time analytics</p>
        </div>
        <button 
          onClick={() => fetchDashboardData()}
          className="flex items-center gap-2 bg-zinc-900 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all"
        >
          <RefreshCcw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.users.total.toLocaleString()} 
          icon={<Users size={18} className="text-orange-500" />}
        >
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userRatioData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value" stroke="none">
                  {userRatioData.map((entry, index) => (
                    <Cell key={`cell-user-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </StatCard>

        <StatCard 
          title="Storage Usage" 
          value={stats.storage.total_human_readable} 
          icon={<HardDrive size={18} className={storagePercent > 90 ? 'text-red-500' : 'text-zinc-400'} />}
        >
          <div className="w-full mt-4 space-y-3">
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-out" 
                style={{ width: `${storagePercent}%`, backgroundColor: getStorageColor(storagePercent) }} 
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
              <span>{storagePercent.toFixed(1)}% Capacity</span>
              <span className={storagePercent > 90 ? 'text-red-500' : ''}>{storagePercent > 90 ? 'Critical' : 'Healthy'}</span>
            </div>
          </div>
        </StatCard>

        <StatCard 
          title="Total Tracks" 
          value={stats.content.total_tracks.toLocaleString()} 
          icon={<Music size={18} className="text-zinc-400" />}
        >
          <div className="h-24 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genreData} innerRadius={20} outerRadius={32} dataKey="value" stroke="none">
                  {genreData.map((entry: { color: string }, i: number) => (
                    <Cell key={`cell-genre-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </StatCard>

        <StatCard 
          title="Pending Reports" 
          value={stats.moderation.reports_pending} 
          icon={<AlertCircle size={18} className={stats.moderation.reports_pending > 10 ? 'text-orange-500' : 'text-zinc-400'} />}
        >
          <div className="grid grid-cols-8 gap-1.5 mt-4">
            {[...Array(Math.min(stats.moderation.reports_pending, 24))].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
            ))}
          </div>
        </StatCard>
      </div>

      {/* Analytics & Moderation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Urgent Moderation Queue (2/3 width) */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Urgent Moderation Queue
            </h3>
            <button className="text-xs text-zinc-500 hover:text-orange-500 flex items-center gap-1 transition-colors">
              View All Reports <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-800/60 transition-all flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">
                    <Disc size={20} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Track #{5500 + i}</span>
                      <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Copyright</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Similarity detected in audio fingerprinting...</p>
                  </div>
                </div>
                <button className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-500 hover:text-white transition-all">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Segmentation (1/3 width) */}
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            User Segmentation
          </h3>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#f4f4f5', fontSize: '12px', fontWeight: '600' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-dist-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

         
        </div>

      </div>
    </div>
  );
}