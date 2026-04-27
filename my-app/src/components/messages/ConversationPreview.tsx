"use client";

import Image from "next/image";
import type { ConversationPreview as ConversationPreviewType } from "@/src/types/messages";

const FALLBACK = "/images/profile.png";

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "now";
  if (diff < 60) return `${diff} minutes ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  return `${Math.floor(diff / 1440)} days ago`;
}

export default function ConversationPreview({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationPreviewType;
  active?: boolean;
  onClick: () => void;
}) {
  const lastText =
    conversation.lastMessage?.type === "TRACK_SHARE"
      ? conversation.lastMessage.text || "Shared a track"
      : conversation.lastMessage?.type === "PLAYLIST_SHARE"
        ? conversation.lastMessage.text || "Shared a playlist"
        : conversation.lastMessage?.text || "No messages yet";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded px-4 py-3 text-left transition ${
        active ? "bg-zinc-800" : "hover:bg-zinc-900"
      }`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-700">
        <Image
          src={conversation.participant.avatar_url || FALLBACK}
          alt={conversation.participant.display_name}
          fill
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {conversation.unreadCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-[#ff5500]" />
          )}
          <p className="truncate text-sm font-bold text-white">
            {conversation.participant.display_name}
          </p>
        </div>
        <p className="truncate text-xs text-zinc-400">{lastText}</p>
      </div>

      <p className="shrink-0 text-xs text-zinc-500">
        {timeAgo(conversation.updatedAt)}
      </p>
    </button>
  );
}