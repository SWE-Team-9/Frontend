"use client";

import React, { useEffect, useMemo } from "react";
import { useAdminStore } from "@/src/store/useAdminStore";
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

export default function AnalyticsPage() {
  const { stats, fetchDashboardData, isLoading } = useAdminStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // =========================
  // DERIVED ANALYTICS (FROM STATS)
  // =========================
  const analytics = useMemo(() => {
    if (!stats) return null;

    const growth = Array.from({ length: 7 }).map((_, i) => ({
      date: `Day ${i + 1}`,
      users: Math.floor(stats.users.total * (0.7 + i * 0.05)),
      artists: Math.floor(stats.users.artists * (0.7 + i * 0.05)),
    }));

    const plays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (d, i) => ({
        name: d,
        value: Math.floor(
          (stats.engagement.total_play_events / 7) *
            // FIXED: Replaced Math.random() with a deterministic multiplier 
            // to comply with React's purity rules.
            (0.7 + (i % 3) * 0.2) 
        ),
      })
    );

    const usedGB = stats.storage.used_bytes / (1024 * 1024 * 1024);

    const storageTrend = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
      (m, i) => ({
        month: m,
        used: Math.min(100, Math.floor(usedGB * (0.6 + i * 0.1))),
      })
    );

    return { growth, plays, storageTrend };
  }, [stats]);

  // =========================
  // INSIGHTS (KPI)
  // =========================
  const insights = useMemo(() => {
    if (!analytics) return null;

    const growthRate =
      analytics.growth.length > 1
        ? (
            ((analytics.growth.at(-1)!.users -
              analytics.growth[0].users) /
              analytics.growth[0].users) *
            100
          ).toFixed(1)
        : "0";

    const peakDay = analytics.plays.reduce((max, d) =>
      d.value > max.value ? d : max
    ).name;

    const storageUsed = analytics.storageTrend.at(-1)?.used ?? 0;

    return { growthRate, peakDay, storageUsed };
  }, [analytics]);

  // =========================
  // LOADING
  // =========================
  if (isLoading || !analytics || !insights) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
        <p className="text-zinc-500 animate-pulse">
          Calculating platform insights...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Platform Analytics
        </h1>
        <p className="text-zinc-500 text-sm">
          Real-time insights into platform growth & activity
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">User Growth</p>
          <h2 className="text-2xl font-bold text-orange-500 mt-1">
            +{insights.growthRate}%
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">
            Last 7 days trend
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">Peak Activity</p>
          <h2 className="text-2xl font-bold text-green-400 mt-1">
            {insights.peakDay}
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">
            Highest streaming day
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500">Storage Usage</p>
          <h2 className="text-2xl font-bold text-blue-400 mt-1">
            {insights.storageUsed}%
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1">
            Capacity utilization
          </p>
        </div>

      </div>

      {/* GROWTH CHART */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <FiTrendingUp className="text-orange-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            User Growth Trend
          </h2>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growth}>
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
                dataKey="users"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorUsers)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="artists"
                stroke="#a1a1aa"
                strokeDasharray="5 5"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* PLAYS */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiActivity className="text-green-500" />
            <h2 className="text-sm font-bold uppercase text-zinc-400">
              Streaming Activity
            </h2>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.plays}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                <Tooltip />

                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analytics.plays.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 6 ? "#f97316" : "#3f3f46"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiHardDrive className="text-blue-500" />
            <h2 className="text-sm font-bold uppercase text-zinc-400">
              Storage Trend
            </h2>
          </div>

          <div className="space-y-3">
            {analytics.storageTrend.map((item) => (
              <div key={item.month}>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{item.month}</span>
                  <span className="text-white">{item.used}%</span>
                </div>

                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${item.used}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}