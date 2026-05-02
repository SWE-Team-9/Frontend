"use client";

import React, { useEffect, useState } from "react";
import { useAdminStore } from "@/src/store/useAdminStore";
import { adminServiceReal } from "@/src/services/admin/adminService.real";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { FiTrendingUp, FiActivity, FiHardDrive } from "react-icons/fi";


interface DailyMetric {
  date: string;
  new_users: number;
  tracks_uploaded: number;
  total_storage_bytes: number;
  active_subscribers: number;
}

export default function AnalyticsPage() {
  const { stats, fetchDashboardData, isLoading } = useAdminStore();
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
  const dateTo = new Date().toISOString().split("T")[0];
  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  adminServiceReal
    .getDailyStats(dateFrom, dateTo)
    .then((data) => {
      // Use unknown as a bridge to resolve the "Two different types" conflict
      const metrics = (data.metrics as unknown as DailyMetric[]) ?? [];
      setDailyMetrics(metrics);
    })
    .catch(() => setDailyMetrics([]))
    .finally(() => setDailyLoading(false));
}, []);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
        <p className="text-zinc-500 animate-pulse">
          Loading platform analytics...
        </p>
      </div>
    );
  }

  const storagePercent = stats.storage.total_bytes
    ? ((stats.storage.used_bytes / stats.storage.total_bytes) * 100).toFixed(1)
    : "0";

  const growthData = dailyMetrics.map((d) => ({
    date: d.date.slice(5), // MM-DD
    new_users: d.new_users,
    tracks: d.tracks_uploaded,
  }));

  const playsData = [
    { name: "Total Plays", value: stats.engagement.total_play_events, color: "#f97316" },
    { name: "Completed (≥90%)", value: stats.engagement.completed_play_events, color: "#22c55e" },
  ];

  const storageSegments = [
    { month: "Used", used: parseFloat(storagePercent) },
    { month: "Free", used: Math.max(0, 100 - parseFloat(storagePercent)) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-zinc-500 text-sm">
          Real-time insights into platform growth &amp; activity
        </p>
      </div>

      {/* KPI CARDS — real engagement data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">Total Play Events</p>
          <h2 className="text-2xl font-bold text-orange-500 mt-1">
            {stats.engagement.total_play_events.toLocaleString()}
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">All-time play events</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">Play-Through Rate</p>
          <h2 className="text-2xl font-bold text-green-400 mt-1">
            {stats.engagement.play_through_rate_pct.toFixed(1)}%
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">
            Listeners completing ≥90% of tracks
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">Storage Used</p>
          <h2 className="text-2xl font-bold text-blue-400 mt-1">
            {stats.storage.total_human_readable}
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">
            {storagePercent}% capacity utilization
          </p>
        </div>

      </div>

      {/* DAILY USER GROWTH CHART */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <FiTrendingUp className="text-orange-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            New Users — Last 30 Days
          </h2>
        </div>

        {dailyLoading ? (
          <div className="h-75 flex items-center justify-center text-zinc-600 text-sm">
            Loading daily data...
          </div>
        ) : growthData.length === 0 ? (
          <div className="h-75 flex items-center justify-center text-zinc-600 text-sm italic">
            No daily data available for this period.
          </div>
        ) : (
          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} />
                <YAxis stroke="#52525b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="new_users"
                  name="New Users"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="tracks"
                  name="Tracks Uploaded"
                  stroke="#a1a1aa"
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* PLAYS vs COMPLETED */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiActivity className="text-green-500" />
            <h2 className="text-sm font-bold uppercase text-zinc-400">
              Total vs Completed Plays
            </h2>
          </div>

          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playsData}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {playsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-zinc-600 mt-3">
            Completed = listener stayed for ≥90% of track duration
          </p>
        </div>

        {/* STORAGE */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiHardDrive className="text-blue-500" />
            <h2 className="text-sm font-bold uppercase text-zinc-400">
              Storage Capacity
            </h2>
          </div>

          <div className="space-y-4 mt-4">
            {storageSegments.map((item) => (
              <div key={item.month}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{item.month}</span>
                  <span className="text-white">{item.used.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.used}%`,
                      backgroundColor: item.month === "Used" ? "#3b82f6" : "#27272a",
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-zinc-800 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Used</span>
                <span className="text-white">{stats.storage.total_human_readable}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total Artists</span>
                <span className="text-white">{stats.users.artists.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total Tracks</span>
                <span className="text-white">{stats.content.total_tracks.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
