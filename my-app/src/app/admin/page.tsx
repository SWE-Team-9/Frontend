"use client";

import React, { useEffect, useMemo } from 'react';
import { useAdminStore } from '@/src/store/useAdminStore';
import { StatCard } from '@/src/components/admin/StatCard';
import {
  Users,
  HardDrive,
  Music,
  TrendingUp,
  RefreshCcw,
  Disc,
  ArrowRight,
  Mic2,
  Headphones,
  CheckCircle2,
  Scale,
  PlayCircle,
  Play,
  Gauge
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

interface BasicReport {
  id: string;
  target?: { title: string };
  reporter?: { handle: string };
  created_at: string;
}

export default function AdminDashboard() {
  const { stats, reports, fetchDashboardData, isLoading, mostReported, analytics, totalStorage } = useAdminStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // =============================
  // STORAGE CALCULATION
  // =============================
  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const storageMetrics = useMemo(() => {
    // 1. GET USED STORAGE (From Overview Stats or Trend)
    const latestTrendUsed = analytics?.storageTrend?.[analytics.storageTrend.length - 1]?.used;
    const usedBytes = latestTrendUsed ?? stats?.storage?.used_bytes ?? 0;

    // 2. GET TOTAL STORAGE (From your new dedicated endpoint/store value)
    const totalBytes = totalStorage || stats?.storage?.total_bytes || 0;

    // 3. CALCULATE PERCENTAGE
    const percent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    return {
      usedHuman: formatBytes(usedBytes),
      totalHuman: formatBytes(totalBytes),
      percent: Math.min(percent, 100),
      isCritical: percent > 90,
      rawPercent: percent
    };
  }, [analytics, stats, totalStorage]);

  // =============================
  // URGENT REPORTS
  // =============================
  const urgentReports = useMemo(() => {
    if (!reports) return [];

    const pending = reports.filter(
      (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
    );

    const mostReportedTracks =
      mostReported?.tracks?.map((t) => ({
        id: t.id,
        title: t.title,
        isFromMostReported: true,
        created_at: new Date().toISOString(),
        reporter: { handle: "system" },
        target: {
          type: "TRACK",
          title: t.title,
        },
      })) || [];

    return [...pending, ...mostReportedTracks]
      .slice(0, 5)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }, [reports, mostReported]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
      </div>
    );
  }

  // =============================
  // DATA PREPARATION
  // =============================
  const userRatioData = [
    { name: 'Listeners', value: stats.users.listeners || 0, color: '#f97316' },
    { name: 'Artists', value: stats.users.artists || 0, color: '#3f3f46' }
  ];

  const userDistributionData = [
    { name: 'Active', value: stats.users.active, color: '#f97316' },
    { name: 'Listeners', value: stats.users.listeners, color: '#0e0e48' },
    { name: 'Artists', value: stats.users.artists, color: '#6366f1' },
    { name: 'Suspended', value: stats.users.suspended, color: '#eab308' },
    { name: 'Banned', value: stats.users.banned, color: '#ef4444' },
  ];

  const playsData = [
    {
      name: 'Completed',
      value: stats.engagement.completed_play_events,
      color: '#22c55e'
    },
    {
      name: 'Incomplete',
      value: Math.max(0, stats.engagement.total_play_events - stats.engagement.completed_play_events),
      color: '#f97316'
    }
  ];

  const getStorageColor = (percent: number) => {
    if (percent > 90) return '#ef4444';
    if (percent > 75) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Platform overview and real-time analytics
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-zinc-900 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all"
        >
          <RefreshCcw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* USERS */}
        <StatCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          icon={<Users size={18} className="text-orange-500" />}
        >
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userRatioData} innerRadius={25} outerRadius={35} dataKey="value">
                  {userRatioData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </StatCard>

        {/* STORAGE - FIXED CALCULATION */}
        <StatCard
          title="Storage Usage"
          value={storageMetrics.usedHuman}
          icon={<HardDrive size={18} className={storageMetrics.isCritical ? "text-red-500" : "text-zinc-400"} />}
        >
          <div className="w-full mt-4 space-y-3">
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${storageMetrics.percent}%`,
                  backgroundColor: getStorageColor(storageMetrics.percent)
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span>{storageMetrics.percent.toFixed(1)}% of {storageMetrics.totalHuman}</span>
              <span style={{ color: getStorageColor(storageMetrics.percent) }}>
                {storageMetrics.isCritical ? 'Critical' : 'Healthy'}
              </span>
            </div>
          </div>
        </StatCard>

        {/* TRACKS */}
        <StatCard
          title="Total Tracks"
          value={stats.content.total_tracks.toLocaleString()}
          icon={<Music size={18} />}
        >
          <div className="mt-4 space-y-2">
            <div className="text-xs text-zinc-500">Track Visibility</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 h-2 rounded overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(stats.content.tracks_visible / stats.content.total_tracks) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Visible: {stats.content.tracks_visible}</span>
              <span>Hidden: {stats.content.total_tracks - stats.content.tracks_visible}</span>
            </div>
          </div>
        </StatCard>

        {/* TOTAL PLAYS */}
        <StatCard
          title="Total Plays"
          value={stats.engagement.total_play_events.toLocaleString()}
          icon={<PlayCircle size={18} className="text-orange-500" />}
        >
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={playsData} innerRadius={25} outerRadius={35} dataKey="value">
                  {playsData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </StatCard>
      </div>

      {/* Audience & Engagement Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Mic2 size={14} className="text-orange-500" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Artists</p>
          </div>
          <h3 className="text-xl font-bold text-white">{stats.users.artists.toLocaleString()}</h3>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Headphones size={14} className="text-blue-400" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Listeners</p>
          </div>
          <h3 className="text-xl font-bold text-white">{stats.users.listeners.toLocaleString()}</h3>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={14} className="text-purple-400" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Artist Ratio</p>
          </div>
          <h3 className="text-xl font-bold text-white">
            {stats.users.artist_to_listener_ratio != null
              ? stats.users.artist_to_listener_ratio.toFixed(4)
              : '—'}
          </h3>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Play size={14} className="text-green-400" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Total Plays</p>
          </div>
          <h3 className="text-xl font-bold text-white">{stats.engagement.total_play_events.toLocaleString()}</h3>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Completed</p>
          </div>
          <h3 className="text-xl font-bold text-white">{stats.engagement.completed_play_events.toLocaleString()}</h3>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={14} className="text-yellow-400" />
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Play-Through</p>
          </div>
          <h3 className="text-xl font-bold text-white">{stats.engagement.play_through_rate_pct.toFixed(1)}%</h3>
        </div>
      </div>

      {/* Analytics & Moderation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* URGENT MODERATION */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Disc size={20} className="text-red-500" /> 
              Urgent Moderation Queue 
            </h3>
            <button 
              className="text-xs text-zinc-500 hover:text-orange-500 flex items-center gap-1" 
              onClick={() => window.location.href = '/admin/reports'} 
            >
              View All Reports <ArrowRight size={14} />
            </button>
          </div>

          {urgentReports.length === 0 ? (
            <p className="text-zinc-500 text-md py-10 text-center">No urgent reports</p>
          ) : (
            <div className="space-y-3">
              {urgentReports.map((r: BasicReport) => (
                <div
                  key={r.id}
                  className="p-4 bg-zinc-900 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {r.target?.title || "Untitled"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Reported by @{r.reporter?.handle || "system"}
                    </p>
                  </div>
                   <button 
                    className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-500 hover:text-white transition-colors" 
                    onClick={() => window.location.href = `/admin/reports/${r.id}`}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* USER SEGMENTATION */}
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-md font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            User Segmentation
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistributionData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {userDistributionData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
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