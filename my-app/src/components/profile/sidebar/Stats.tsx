import React from "react";

interface StatsProps {
  followers: number;
  following: number;
  tracks: number;
}
export const Stats = ({ followers, following, tracks }: StatsProps) => {
  return (
    <div className="flex justify-between w-full text-left">
      <div className="flex flex-col">
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-1">Followers</span>
        <span className="text-white text-[32px] font-bold tracking-tighter leading-none">{followers}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-1">Following</span>
        <span className="text-white text-[32px] font-bold tracking-tighter leading-none">{following}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-1">Tracks</span>
        <span className="text-white text-[32px] font-bold tracking-tighter leading-none">{tracks}</span>
      </div>
      
    </div>
    
  );
};