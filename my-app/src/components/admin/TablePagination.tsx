"use client";

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TablePagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/20">
      <div className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
        Showing Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700"
        >
          Previous
        </button>
        
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          Next
        </button>
      </div>
    </div>
  );
};