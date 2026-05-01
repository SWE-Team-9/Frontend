"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[420px] max-w-[90vw] bg-[#1a1a1a] border border-zinc-800 rounded-lg shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-zinc-500 hover:text-white"
        >
          <FaTimes size={14} />
        </button>

        <h2 className="text-white text-base font-bold mb-2">{title}</h2>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              destructive
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-[#f50] text-white hover:bg-[#e64a00]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}