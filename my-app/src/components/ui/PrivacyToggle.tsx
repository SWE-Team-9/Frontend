import React from 'react';

interface PrivacyToggleProps {
  isPrivate: boolean;
  onToggle: () => void;
}

export const PrivacyToggle = ({ isPrivate, onToggle }: PrivacyToggleProps) => (
  <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded border border-zinc-800/30 mt-4">
    <div className="flex flex-col text-left">
      <span className="font-bold text-[12px] text-white uppercase tracking-wider">Private Mode</span>
      <span className="text-[10px] text-zinc-500 font-bold">Only you can see this profile</span>
    </div>
    <div 
      onClick={onToggle}
      className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isPrivate ? 'bg-[#f50]' : 'bg-zinc-600'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);