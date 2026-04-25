"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useMessageStore } from "@/src/store/messageStore";
import MessageComposer from "@/src/components/messages/MessageComposer";
import SharedTrackCard from "@/src/components/messages/SharedTrackCard";
import SharedPlaylistCard from "@/src/components/messages/SharedPlaylistCard";
import ArchiveConversationPopover from "@/src/components/messages/ArchiveConversationPopover";

function timeLabel(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow() {
  const selected = useMessageStore((s) => s.selectedConversation);
  const messages = useMessageStore((s) => s.messages);
  const loadOlderMessages = useMessageStore((s) => s.loadOlderMessages);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const markUnread = useMessageStore((s) => s.markUnread);
  const archiveConversation = useMessageStore((s) => s.archiveConversation);
  const [showArchive, setShowArchive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [selected?.conversationId]);

  if (!selected) {
    return (
      <section className="flex h-[calc(100vh-64px)] flex-1 items-center justify-center text-zinc-500">
        Select a conversation
      </section>
    );
  }

    return (
    <section className="flex h-[calc(100vh-64px)] flex-1 flex-col p-8">
        <header className="mb-6 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-8">
            <h2 className="text-lg font-bold">{selected.participant.display_name}</h2>
            <button className="text-sm font-bold text-white">Block</button>
            <button className="text-sm font-bold text-white">Report</button>
        </div>

        <div className="relative flex items-center gap-2">
            <button
            onClick={() => markUnread(selected.conversationId)}
            className="rounded bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
            >
            Mark as unread
            </button>

            <button
            onClick={() => setShowArchive((v) => !v)}
            className="rounded bg-zinc-800 p-2 text-white hover:bg-zinc-700"
            >
            <Trash2 className="h-4 w-4" />
            </button>

            {showArchive && (
            <ArchiveConversationPopover
                onCancel={() => setShowArchive(false)}
                onArchive={async () => {
                await archiveConversation(selected.conversationId);
                setShowArchive(false);
                }}
            />
            )}
        </div>
        </header>

        <div
        ref={scrollRef}
        onScroll={(e) => {
            if (e.currentTarget.scrollTop === 0) loadOlderMessages();
        }}
        className="flex-1 overflow-y-auto pr-4"
        >
        <div className="space-y-6 pb-8">
            {messages.map((message) => {
            const isMe = message.senderId === "me";

            return (
                <div key={message.id} className="flex gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-[#d7837b] to-[#b66]" />

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between">
                    <p className="font-bold text-white">
                        {isMe ? "Me" : selected.participant.display_name}
                    </p>
                    <span className="text-xs text-zinc-500">
                        {timeLabel(message.createdAt)}
                    </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm text-zinc-300">
                    {message.text}
                    </p>

                    {message.sharedTrack && (
                    <SharedTrackCard track={message.sharedTrack} />
                    )}

                    {message.sharedPlaylist && (
                    <SharedPlaylistCard playlist={message.sharedPlaylist} />
                    )}
                </div>
                </div>
            );
            })}
        </div>

        <div className="pb-8">
            <MessageComposer
            receiverId={selected.participant.id}
            onSend={(text, attachment) =>
                sendMessage(selected.participant.id, text, attachment)
            }
            />
        </div>
        </div>
    </section>
    );
}