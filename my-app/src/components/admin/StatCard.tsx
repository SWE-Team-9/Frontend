import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  children?: React.ReactNode; // For the charts
  statusColor?: string; // e.g., 'text-green-500' or 'text-red-500'
  icon: React.ReactNode;
}

export const StatCard = ({ title, value, subValue, children, statusColor }: StatCardProps) => (
  <div className="bg-[#1a1a1a] border border-zinc-800 p-5 rounded-xl flex flex-col h-full hover:border-zinc-700 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className={`text-2xl font-bold ${statusColor || 'text-white'}`}>{value}</h3>
          {subValue && <span className="text-zinc-600 text-xs">{subValue}</span>}
        </div>
      </div>
    </div>
    
    <div className="flex-1 flex items-center justify-center mt-2">
      {children}
    </div>
  </div>
);