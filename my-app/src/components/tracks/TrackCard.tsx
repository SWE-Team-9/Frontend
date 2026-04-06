import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { Track } from '../../types/track';

import { 
  Play, MoreHorizontal, BarChart2, 
  Trash2, Edit2, ListPlus, Repeat 
} from 'lucide-react';

import { TrackActionButtons } from "./TrackActionButtons";

interface TrackCardProps {
  track: Track;
  onEdit: (track: Track) => void;
  onDelete: (id: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, onEdit, onDelete }) => {
  return (
    // MAIN CONTAINER
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-6 items-start hover:bg-[#252525] transition-colors relative group">
      
      {/* 1. LEFT SECTION: Artwork */}
      <div className="w-40 h-40 bg-[#333] rounded-md flex-shrink-0 animate-pulse">
        {/* Artwork Placeholder */}
      </div>

      {/* 2. RIGHT SECTION */}
      <div className="flex-grow flex flex-col gap-3 min-w-0 h-40 justify-between">
        
        {/* A. Top: Artist, Title */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform flex-shrink-0">
              <Play className="w-6 h-6 fill-black" />
            </button>
            <div className="truncate">
              <p className="text-zinc-400 text-sm">Gehad</p>
              <h4 className="text-white text-xl font-bold truncate">{track.title}</h4>
            </div>
          </div>
          <span className="text-zinc-500 text-xs flex-shrink-0">in 1 day</span>
        </div>

        {/* B. Middle: Waveform */}
        <div className="w-full h-16 bg-zinc-800/50 rounded flex items-center justify-center border border-dashed border-zinc-700 relative">
          <p className="text-zinc-600 text-xs italic">[ Waveform Placeholder ]</p>
          <span className="absolute bottom-1 right-2 text-zinc-500 text-[10px]">2:19</span>
        </div>

        {/* C. Bottom: ACTIONS ROW */}
        <div className="flex items-center justify-between mt-auto">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-2 relative z-10"
          >
            <TrackActionButtons
              trackId={track.trackId}
              title={track.title}
              likesCount={track.likesCount ?? 0}
              liked={track.liked ?? false}
              repostsCount={track.repostsCount ?? 0}
              reposted={track.reposted ?? false}
              size="full"
            />
          </div>

          {/* MANAGEMENT BUTTONS (Grouped to the right) */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onEdit(track)} 
              className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]"
              title="Edit Metadata"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onDelete(track.trackId)} 
              className="p-2.5 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20"
              title="Delete Track"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]">
                <MoreHorizontal className="w-4 h-4" />
              </MenuButton>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right rounded-md bg-[#181818] border border-zinc-800 shadow-xl focus:outline-none z-50">
                  <div className="px-1 py-1">
                    <MenuItem>
                      {({ active }) => (  
                        <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                          <ListPlus className="mr-2 h-4 w-4" /> Add to Playlist
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (  
                        <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                          <Repeat className="mr-2 h-4 w-4" /> Station
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (  
                        <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                          <BarChart2 className="mr-2 h-4 w-4" /> Your Insights
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
};