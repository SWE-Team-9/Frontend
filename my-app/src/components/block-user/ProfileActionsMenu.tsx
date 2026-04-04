"use client";

import { useState, useRef, useEffect } from "react";
import { useBlockStore } from "@/src/store/useBlockStore";
import { MdMoreVert } from "react-icons/md";
import ConfirmModal from "@/src/components/block-user/ConfirmModal";

interface Props {
  userId: string;
  displayName: string;
  isBlocked: boolean;
}

export default function ProfileActionsMenu({ userId, displayName }: Props) {
  const {
    blockUser,
    unblockUser,
    blockedUsers,
    fetchBlockedUsers,
    loadingUserId,
  } = useBlockStore();

  const loading = loadingUserId === userId;
  const isBlocked = blockedUsers.some((u) => u.id === userId);

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch blocked users on mount if empty
  useEffect(() => {
    if (blockedUsers.length === 0) {
      fetchBlockedUsers();
    }
  }, [blockedUsers.length, fetchBlockedUsers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = async () => {
    if (isBlocked) {
      await unblockUser(userId);
    } else {
      await blockUser(userId);
    }
    setConfirmOpen(false);
  };

  return (
    <div className="relative overflow-visible" ref={menuRef}>
      {/* 3-dot button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-zinc-800 transition"
      >
        <MdMoreVert size={20} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-999">
          {" "}
          <button
            disabled={loading}
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="w-full text-center font-bold text-md px-4 py-2 text-red-400 hover:bg-zinc-800 rounded-lg"
          >
            {loading
              ? "Processing..."
              : isBlocked
                ? "Unblock User"
                : "Block User"}
          </button>
        </div>
      )}

      {/* Confirm Modal*/}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        displayName={displayName}
        isBlocked={isBlocked}
      />
    </div>
  );
}
