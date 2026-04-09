"use client";
import React from "react";
import { AvatarUpload } from "@/src/components/profile/AvatarUpload";
import { CoverPhoto } from "@/src/components/profile/CoverPhoto";

interface ProfileHeaderProps {
  displayName: string;
  location: string;
  accountType: string;
}

export const ProfileHeader = ({ displayName, location, accountType }: ProfileHeaderProps) => {
  return (
    <div className="relative w-full min-h-65 bg-[#d38b7d] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left mt-2">
        <CoverPhoto />
        <AvatarUpload username={displayName} location={location} />

        <div className="flex flex-col gap-1.5 items-center md:items-start">
          <div className="flex flex-col md:flex-row items-center gap-2 bg-black px-3 py-1 w-fit">
            <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tight">
              {displayName}
            </h1>
            {accountType === "ARTIST" && (
              <span className="bg-zinc-800 text-zinc-400 text-[10px] md:text-[12px] px-2 py-1 rounded-sm font-black uppercase border border-zinc-700/50 shadow-sm shrink-0">
                Artist
              </span>
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-neutral-400 text-[10px] md:text-xs bg-black px-2 py-1 w-fit font-bold uppercase">
                {location}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};