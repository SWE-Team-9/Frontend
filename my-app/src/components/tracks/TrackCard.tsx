import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Track } from '../../types/track';
import { 
  Play, MoreHorizontal, Heart, BarChart2, 
  Trash2, Edit2, ListPlus, Share2, Link2, Repeat 
} from 'lucide-react';

interface TrackCardProps {
  track: Track;
  onEdit: (track: Track) => void;
  onDelete: (id: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, onEdit, onDelete }) => {
  return (
    // MAIN CONTAINER: Gray background, rounded, padding, and Flex layout
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-6 items-start hover:bg-[#252525] transition-colors relative group">
      
      {/* 1. LEFT SECTION: The Big Artwork Placeholder (Module 3/None assignment) */}
      <div className="w-40 h-40 bg-[#333] rounded-md flex-shrink-0 animate-pulse">
        {/* Later, this will show the track cover image */}
      </div>

      {/* 2. RIGHT SECTION: Details, Waveform, Actions (Your main focus) */}
      <div className="flex-grow flex flex-col gap-3 min-w-0 h-full justify-between">
        
        {/* A. Top: Artist, Title, and Date */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Play Button (Module 5 integration placeholder) */}
            <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform flex-shrink-0">
              <Play className="w-6 h-6 fill-black" />
            </button>
            <div className="truncate">
              <p className="text-zinc-400 text-sm">Gehad</p> {/* Artist Name */}
              <h4 className="text-white text-xl font-bold truncate">{track.title}</h4> {/* Track Title */}
            </div>
          </div>
          {/* Track Duration/Date (Placeholder) */}
          <span className="text-zinc-500 text-xs flex-shrink-0">in 1 day</span>
        </div>

        {/* B. Middle: THE WAVEFORM PLACEHOLDER */}
        <div className="w-full h-16 bg-zinc-800/50 rounded flex items-center justify-center border border-dashed border-zinc-700 relative">
          <p className="text-zinc-600 text-xs italic">[ Waveform Placeholder  ]</p>
          <span className="absolute bottom-1 right-2 text-zinc-500 text-[10px]">2:19</span>
        </div>

        {/* C. Bottom: Action Buttons */}
        <div className="flex items-center gap-2 mt-2">
          {/* Quick Actions (Module 3/Social assignment) */}
          <button className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]">
            <Heart className="w-4 h-4" /> {/* Like */}
          </button>
          <button className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]">
            <Share2 className="w-4 h-4" /> {/* Repost */}
          </button>
          <button className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]">
            <Link2 className="w-4 h-4" /> {/* Copy Link */}
          </button>
          
          {/* MANAGEMENT BUTTONS (YOUR FOCUS AREA) */}
          
          {/* Edit Button: Triggers the edit handler with the full track object */}
          <button 
            onClick={() => onEdit(track)} 
            className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]"
            title="Edit Metadata"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button: Triggers the delete handler with the track ID */}
          <button 
            onClick={() => onDelete(track.trackId)} 
            className="p-2.5 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20"
            title="Delete Track"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Dropdown Menu for additional actions */}
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="p-2.5 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]">
                <MoreHorizontal className="w-4 h-4" />
              </Menu.Button>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-zinc-800 rounded-md bg-[#181818] border border-zinc-800 shadow-xl focus:outline-none z-50">
                   <div className="px-1 py-1">
                     <Menu.Item>
                       {({ active }) => (
                         <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                           <ListPlus className="mr-2 h-4 w-4" /> Add to Playlist
                         </button>
                       )}
                     </Menu.Item>
                     <Menu.Item>
                       {({ active }) => (
                         <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                           <Repeat className="mr-2 h-4 w-4" /> Station
                         </button>
                       )}
                     </Menu.Item>
                     <Menu.Item>
                       {({ active }) => (
                         <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                           <BarChart2 className="mr-2 h-4 w-4" /> Your Insights
                         </button>
                       )}
                     </Menu.Item>
                   </div>

                   <div className="px-1 py-1">
                     {/* Secondary Edit Option inside Menu */}
                     <Menu.Item>
                       {({ active }) => (
                         <button 
                           onClick={() => onEdit(track)}
                           className={`${active ? 'bg-zinc-800 text-white' : 'text-zinc-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                         >
                           <Edit2 className="mr-2 h-4 w-4" /> Edit Metadata
                         </button>
                       )}
                     </Menu.Item>

                     {/* Secondary Delete Option inside Menu */}
                     <Menu.Item>
                       {({ active }) => (
                         <button 
                           onClick={() => onDelete(track.trackId)}
                           className={`${active ? 'bg-red-900/40 text-red-200' : 'text-red-500'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                         >
                           <Trash2 className="mr-2 h-4 w-4" /> Delete Track
                         </button>
                       )}
                     </Menu.Item>
                   </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

      </div>
    </div>
  );
};