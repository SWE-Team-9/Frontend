"use client";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/src/store/playerStore";
import { MdOutlineCancel } from "react-icons/md";
import { MdLocationOff } from "react-icons/md";
import { MdErrorOutline } from "react-icons/md";
import { MdHourglassTop } from "react-icons/md";

interface ToastConfig {
  message: string;
  sub?: string;
  icon: React.ReactNode;
  link?: string;
}

function getToast(
  accessState: string | null,
  accessReason: string | null,
  streamError: string | null,
  isProcessing: boolean,
): ToastConfig | null {
  if (accessState === "BLOCKED") {
    return {
      message: accessReason || "This track was not found. Maybe it has been removed",
      sub: "Learn more",
      icon: <MdLocationOff size={16} />,
      link: "https://help.soundcloud.com/hc/articles/115003563948-Can-t-find-a-track-anymore",
    };
  }
  if (streamError) {
    return {
      message: streamError,
      sub: "Try again later",
      icon: <MdErrorOutline size={16} />,
    };
  }
  if (isProcessing) {
    return {
      message: "This track is still processing.",
      sub: "Try again in a moment.",
      icon: <MdHourglassTop size={16} />,
    };
  }
  return null;
}

export function PlaybackToast() {
  const { accessState, accessReason, streamError, isProcessing } =
    usePlayerStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const toast = getToast(accessState, accessReason, streamError, isProcessing);

  useEffect(() => {
    if (toast) {
      setDismissed(false);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [accessState, streamError, isProcessing]);

  if (!toast || !visible || dismissed) return null;

  return (
    <div
      className="
        fixed bottom-[68px] left-4 z-50
        flex items-start gap-3
        bg-[#1a1a1a] border border-[#2e2e2e]
        rounded-lg px-4 py-3 shadow-2xl
        max-w-sm w-full
        animate-in slide-in-from-bottom-2 fade-in duration-200
      "
    >
      {/* Icon */}
      <span className="flex-shrink-0 mt-0.5 text-[#ccc]">
        {toast.icon}
      </span>
      {/* Message */}
      <div className="flex-1 min-w-0 text-sm text-[#eee]">
        <p className="font-medium leading-tight">{toast.message}</p>
        {toast.sub && toast.link ? (
          <a
            href={toast.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#aaa] text-xs mt-0.5 underline hover:text-white"
          >
            {toast.sub}
          </a>
        ) : (
          toast.sub && <p className="text-[#aaa] text-xs mt-0.5">{toast.sub}</p>
        )}
      </div>
      {/* Dismiss button */}
      <button
        onClick={() => { setVisible(false); setDismissed(true); }}
        className="text-[#666] hover:text-white flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <MdOutlineCancel size={16} />
      </button>
    </div>
  );
}