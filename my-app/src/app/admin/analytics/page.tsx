"use client";
import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/src/store/useAdminStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { FiTrendingUp, FiActivity, FiHardDrive } from 'react-icons/fi';

export default function AnalyticsPage() {
  const { analytics, fetchDashboardData , isLoading} = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    
    if (!analytics) {
      fetchDashboardData();
    }
    return () => clearTimeout(timer);
  }, [analytics, fetchDashboardData]);

  if (!isMounted) return null;

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
        <p className="text-zinc-500 animate-pulse">Calculating platform metrics...</p>
      </div>
    );
  }

  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-zinc-500 text-sm">Deep dive into community growth and server resources</p>
      </div>

      {/* Main Growth Chart */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-orange-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">User Acquisition</h2>
          </div>
          <select className="bg-zinc-800 border-none text-xs text-white rounded-lg px-3 py-1 focus:ring-1 focus:ring-orange-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growth}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="users" stroke="#f97316" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              <Area type="monotone" dataKey="artists" stroke="#a1a1aa" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Plays Bar Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiActivity className="text-green-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Streaming Activity</h2>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.plays}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ display: 'none' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analytics.plays.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#f97316' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 text-center italic">Streaming peaks usually occur on Sundays</p>
        </div>

        {/* Storage Forecast */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <FiHardDrive className="text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Storage Expansion (GB)</h2>
          </div>
          <div className="space-y-4">
            {analytics.storageTrend.map((item) => (
              <div key={item.month}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{item.month}</span>
                  <span className="text-white font-mono">{item.used}GB</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ width: `${item.used}%` }} 
                  />
                </div>
              </div>
            ))}
            <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-[10px] text-blue-400 leading-relaxed">
                <span className="font-bold">Forecast:</span> At current upload rates, storage capacity will reach 90% by December. Consider upgrading S3 buckets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}