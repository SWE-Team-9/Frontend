import React from 'react';

interface SocialLinkInputProps {
  link: { id: number; url: string; title: string };
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export const SocialLinkInput = ({ link, onRemove, onChange }: SocialLinkInputProps) => (
  <div className="flex items-center gap-3 w-full mb-2">
    <input 
      className="flex-[2] bg-[#222] p-2 rounded text-zinc-300 font-bold outline-none focus:border-zinc-500" 
      placeholder="URL" 
      value={link.url} 
      onChange={(e) => onChange(link.id, 'url', e.target.value)} 
    />
    <input 
      className="flex-1 bg-[#222] p-2 rounded text-zinc-300 font-bold outline-none focus:border-zinc-500" 
      placeholder="Title" 
      value={link.title} 
      onChange={(e) => onChange(link.id, 'title', e.target.value)} 
    />
    <button type="button" onClick={() => onRemove(link.id)} className="text-red-500 font-bold p-2">🗑️</button>
  </div>
);