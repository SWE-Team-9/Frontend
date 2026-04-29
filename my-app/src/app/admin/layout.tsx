"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';

import { 
  LuLayoutDashboard, 
  LuUsers,  
  LuSettings, 
  LuLifeBuoy, 
  LuLogOut 
} from "react-icons/lu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mainNav = [
    { label: 'Overview', href: '/admin', icon: LuLayoutDashboard },
    { label: 'Reports', href: '/admin/reports', icon: FiAlertTriangle },
    { label: 'User Management', href: '/admin/users', icon: LuUsers },
    { label: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
    
    
  ];

  const utilityNav = [
    { label: 'Settings', href: '/admin/settings', icon: LuSettings },
    { label: 'Support', href: '/admin/support', icon: LuLifeBuoy },
    { label: 'Log out', href: '/', icon: LuLogOut },
  ];

  return (
    <div className="flex min-h-screen bg-[#111] text-white">
      <aside className="w-64 border-r border-zinc-800 bg-black flex flex-col sticky top-0 h-screen">
        {/* Logo Section */}
        <div className="p-4 border-b border-zinc-800">
          <Image src="/logo.png" alt="Logo" width={100} height={40} className="object-contain" />
        </div>
        
        {/* Main Navigation (Grows to fill space) */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-4 mb-2">Main Menu</p>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-orange-600 text-white font-semibold' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-zinc-500 group-hover:text-orange-500'} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utility Navigation (Fixed at bottom) */}
        <nav className="p-4 space-y-1 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-4 mb-2">System</p>
          {utilityNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isLogout = item.label === 'Log out';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-zinc-800 text-white' 
                    : isLogout 
                      ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/5' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Icon size={16} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Server: Stable</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#111]">
        {/* Rest of the layout remains same */}
        <div className="p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}