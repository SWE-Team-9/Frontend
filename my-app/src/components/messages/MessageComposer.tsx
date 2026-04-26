"use client";

import { useState } from "react";
import AttachResourcePicker from "@/src/components/messages/AttachResourcePicker";
import type { AttachResource } from "@/src/types/messages";

export default function MessageComposer({
  receiverId,
  onSend,
  initialText = "",
  initialAttachment = null,
}: {
  receiverId: string;
  onSend: (text: string, attachment?: AttachResource | null) => Promise<void>;
  initialText?: string;
  initialAttachment?: AttachResource | null;
}) {
  const [text, setText] = useState(initialText);
  const [attachment, setAttachment] = useState<AttachResource | null>(initialAttachment);
  const [showPicker, setShowPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleAttach = (resource: AttachResource) => {
    setAttachment(resource);
    setText((prev) => {
      if (prev.includes(resource.permalink)) return prev;
      return `${prev}${prev.trim() ? "\n" : ""}${resource.permalink}`;
    });
    setShowPicker(false);
  };

  const handleSend = async () => {
    if (!receiverId || !text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text, attachment);
      setText("");
      setAttachment(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t border-zinc-800 pt-5">
      <label className="mb-2 block text-sm font-bold text-white">
        Write your message and add tracks or playlists{" "}
        <span className="text-red-500">*</span>
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-28 w-full resize-none rounded border border-zinc-600 bg-[#2a2a2a] p-3 text-sm text-white outline-none focus:border-white"
      />

      {attachment && (
        <div className="mt-3 flex items-center justify-between rounded bg-zinc-900 p-3 text-sm text-white">
          <span>{attachment.type === "TRACK" ? "Track" : "Playlist"} · {attachment.title}</span>
          <button onClick={() => setAttachment(null)} className="text-zinc-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {showPicker && <AttachResourcePicker onSelect={handleAttach} />}

      <div className="mt-3 flex justify-between">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="rounded bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
        >
          Add track or playlist
        </button>

        <button
          onClick={handleSend}
          disabled={isSending || !receiverId || !text.trim()}
          className="rounded bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}