"use client";

import React, { useState, Fragment } from 'react';
import Image from "next/image";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { 
  Play, MoreHorizontal, BarChart2, Trash2, Edit2, 
  Eye, EyeOff, Check 
} from 'lucide-react';

import { TrackActionButtons } from "./TrackActionButtons";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import { changeTrackVisibility, updateTrackMetadata, TrackDetails } from "@/src/services/uploadService";


export interface IntegratedTrack extends Omit<TrackDetails, 'coverArtUrl'> {
  likesCount?: number;
  liked?: boolean;
  repostsCount?: number;
  reposted?: boolean;
  artistName?: string; 
  coverArt?: string;   
  coverArtUrl?: string; // Added to match your JSX usage
}

interface TrackCardProps {
  track: IntegratedTrack;
  isOwner?: boolean; 
  onDelete?: (id: string, title: string) => void; // Updated to accept title
  onEdit?: (track: any) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, isOwner, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visibility, setVisibility] = useState(track.visibility);
  const [editData, setEditData] = useState({
    title: track.title,
    genre: track.genre || "",
    tags: track.tags?.join(", ") || "",
    description: track.description || ""
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTrackMetadata(track.trackId, {
        ...editData,
        tags: editData.tags.split(",").map(t => t.trim()).filter(Boolean)
      });
      setIsEditing(false);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleToggleVisibility = async () => {
    const newVis = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      await changeTrackVisibility(track.trackId, newVis);
      setVisibility(newVis);
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-lg flex gap-6 items-start hover:bg-[#252525] transition-colors relative group">
      
      {/* 1. Artwork */}
      <div className="w-40 h-40 bg-[#333] rounded-md shrink-0 relative overflow-hidden">
        {(track.coverArtUrl || track.coverArt) ? (
          <Image 
            src={track.coverArtUrl || track.coverArt || ""} 
            alt={track.title} 
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-[#2a2a2a] animate-pulse" />
        )}
      </div>

      {/* 2. Content Section */}
      <div className="flex-grow flex flex-col gap-3 min-w-0">
        
        {isEditing ? (
          /* --- EDIT MODE --- */
          <div className="flex flex-col gap-3 bg-[#181818] p-4 rounded-md border border-zinc-700">
            <input 
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="bg-[#121212] border border-zinc-700 rounded p-2 text-white text-sm"
              placeholder="Track Title"
            />
            <div className="flex gap-2">
               <button 
                 onClick={handleSave} 
                 disabled={isSaving}
                 className="bg-white text-black px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 disabled:opacity-50"
               >
                 <Check className="w-3 h-3"/> {isSaving ? "Saving..." : "Save"}
               </button>
               <button 
                 onClick={() => setIsEditing(false)} 
                 className="border border-zinc-600 text-zinc-400 px-4 py-1.5 rounded text-xs"
               >
                 Cancel
               </button>
            </div>
          </div>
        ) : (
          /* --- VIEW MODE --- */
          <>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shrink-0">
                  <Play className="w-6 h-6 fill-black" />
                </button>
                <div className="truncate">
                  <p className="text-zinc-400 text-sm">{track.artistName || "Artist"}</p>
                  <h4 className="text-white text-xl font-bold truncate">{track.title}</h4>
                </div>
              </div>
              
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${visibility === 'PUBLIC' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {visibility}
              </span>
            </div>

            {/* Waveform */}
            <div className="w-full h-16 bg-zinc-800/30 rounded relative overflow-hidden">
               {track.status === "PROCESSING" ? (
                 <div className="flex items-center justify-center h-full text-[#ff5500] text-xs font-bold italic animate-pulse">PROCESSING...</div>
               ) : <WaveformDisplay />}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-auto">
              <TrackActionButtons
                trackId={track.trackId}
                title={track.title}
                likesCount={track.likesCount ?? 0}
                liked={track.liked ?? false}
                artistName={track.artistName || "Unknown Artist"}
                coverArt={track.coverArt || track.coverArtUrl || ""}
                repostsCount={track.repostsCount ?? 0}
                reposted={track.reposted ?? false}
                size="full"
              />

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button onClick={handleToggleVisibility} className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white" title="Toggle Visibility">
                    {visibility === "PUBLIC" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button onClick={() => setIsEditing(true)} className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white" title="Edit Metadata">
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(track.trackId, track.title);
                      }} 
                      className="p-2 rounded bg-[#2a2a2a] text-red-500 hover:bg-red-900/20 transition-colors"
                      title="Delete Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <Menu as="div" className="relative">
                    <MenuButton className="p-2 rounded bg-[#2a2a2a] text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </MenuButton>
                    <Transition 
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 bottom-full mb-2 w-48 rounded-md bg-[#181818] border border-zinc-800 z-50">
                        <MenuItem>
                          {({ active }) => (
                            <button className={`${active ? 'bg-zinc-800' : ''} text-zinc-300 group flex w-full items-center px-4 py-2 text-sm`}>
                              <BarChart2 className="mr-2 h-4 w-4" /> Insights
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};