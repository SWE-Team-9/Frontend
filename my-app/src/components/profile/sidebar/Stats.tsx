import React from "react";

interface StatsProps {
  followers: number;
  following: number;
  tracks: number;
}

export const Stats = ({ followers, following, tracks }: StatsProps) => (
  <div className="flex justify-between border-b border-zinc-900 pb-4 text-center">
    <div>
      <p className="text-zinc-500 text-[15px] font-bold mb-1 uppercase tracking-tight">Followers</p>
      <p className="text-2xl font-bold">{followers}</p>
    </div>
    <div>
      <p className="text-zinc-500 text-[15px] font-bold mb-1 uppercase tracking-tight">Following</p>
      <p className="text-2xl font-bold">{following}</p>
    </div>
    <div>
      <p className="text-zinc-500 text-[15px] font-bold mb-1 uppercase tracking-tight">Tracks</p>
      <p className="text-2xl font-bold">{tracks}</p>
    </div>
  </div>
  
);