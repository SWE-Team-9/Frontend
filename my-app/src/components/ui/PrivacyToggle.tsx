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
  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors border ${isPrivate ? 'bg-white border-white' : 'bg-zinc-700 border-zinc-700'}`}>
  <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${isPrivate ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`}></div>
</div>
  </div>
);