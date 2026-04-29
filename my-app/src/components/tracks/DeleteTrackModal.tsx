"use client";

import React from "react";

interface DeleteTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trackTitle: string;
}

const DeleteTrackModal: React.FC<DeleteTrackModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trackTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1e1e1e] border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-white text-xl font-bold mb-2">Delete Track</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-semibold"> {`"${trackTitle}"`}</span>?
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded border border-zinc-600 text-zinc-300 font-semibold hover:bg-zinc-800 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTrackModal;
