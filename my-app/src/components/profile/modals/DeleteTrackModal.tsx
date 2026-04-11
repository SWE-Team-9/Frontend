import React from 'react';

interface DeleteTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trackTitle: string;
}

export const DeleteTrackModal = ({ isOpen, onClose, onConfirm, trackTitle }: DeleteTrackModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] border border-zinc-800 p-8 rounded-xl max-w-md w-full shadow-2xl scale-in-center">
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider">Delete Track</h2>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-bold">{trackTitle}</span>? 
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full text-sm font-bold uppercase transition-all active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};