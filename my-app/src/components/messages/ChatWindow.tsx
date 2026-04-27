"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useMessageStore } from "@/src/store/messageStore";
import MessageComposer from "@/src/components/messages/MessageComposer";
import SharedTrackCard from "@/src/components/messages/SharedTrackCard";
import SharedPlaylistCard from "@/src/components/messages/SharedPlaylistCard";
import ArchiveConversationPopover from "@/src/components/messages/ArchiveConversationPopover";
import MessageText from "./MessageText";
import Image from "next/image";
import { useAuthStore } from "@/src/store/useAuthStore";
import {
    buildFullShareUrl,
    buildPlaylistPermalink,
    buildTrackPermalink,
} from "@/src/lib/permalinks";

const FALLBACK = "/images/profile.png";

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
    const unarchiveConversation = useMessageStore((s) => s.unarchiveConversation);
    const conversationView = useMessageStore((s) => s.conversationView);
    const [showArchive, setShowArchive] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoading = useMessageStore((s) => s.isLoading);
    const isLoadingOlder = useMessageStore((s) => s.isLoadingOlder);
    const error = useMessageStore((s) => s.error);
    const currentUser = useAuthStore((s) => s.user);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [selected?.conversationId]);

    if (!selected) {
        return (
            <section className="flex h-[calc(100vh-64px)] flex-1 items-center justify-center bg-[#121212] p-8 text-center">
                <div>
                    <p className="text-2xl font-bold text-white">Select a conversation</p>
                    <p className="mt-2 text-sm text-zinc-500">
                        Choose a chat from the sidebar or start a new message.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex h-[calc(100vh-64px)] flex-1 flex-col p-8">
            <header className="mb-6 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h2 className="text-lg font-bold">{selected.participant.display_name}</h2>

                        {!selected.canMessage && (
                            <p className="mt-1 text-xs text-red-400">
                                {selected.blockReason ||
                                    (selected.isBlockedByMe
                                        ? "You blocked this user."
                                        : selected.hasBlockedMe
                                            ? "This user cannot receive your messages."
                                            : "Messaging unavailable.")}
                            </p>
                        )}
                    </div>
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

                    {conversationView === "active" ? (
                        <button
                            onClick={() => setShowArchive((v) => !v)}
                            className="rounded bg-zinc-800 p-2 text-white hover:bg-zinc-700"
                            title="Archive conversation"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => unarchiveConversation(selected.conversationId)}
                            className="rounded bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
                        >
                            Unarchive
                        </button>
                    )}

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
                {isLoadingOlder && (
                    <div className="mb-4 text-center text-xs font-bold text-zinc-500">
                        Loading older messages...
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {isLoading && messages.length === 0 && (
                    <div className="space-y-6">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex animate-pulse gap-4">
                                <div className="h-12 w-12 rounded-full bg-zinc-800" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-3 w-20 rounded bg-zinc-800" />
                                    <div className="h-4 w-64 rounded bg-zinc-900" />
                                    <div className="h-20 w-full max-w-lg rounded bg-zinc-900" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-6 pb-8">
                    {!isLoading && messages.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-lg font-bold text-zinc-400">
                                No messages in this conversation yet.
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Send a message below to start the conversation.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => {
                        const isMe = message.senderId === "me";

                        const avatarSrc = isMe
                            ? currentUser?.avatarUrl || FALLBACK
                            : selected.participant.avatar_url || FALLBACK;

                        const avatarAlt = isMe
                            ? currentUser?.displayName || "Me"
                            : selected.participant.display_name;

                        const hiddenSharedUrls = [
                            message.sharedTrack
                                ? buildFullShareUrl(
                                    buildTrackPermalink({
                                        trackId: message.sharedTrack.id,
                                        artistHandle: message.sharedTrack.artist?.handle,
                                        slug: message.sharedTrack.slug,
                                    }),
                                )
                                : "",
                            message.sharedPlaylist
                                ? buildFullShareUrl(
                                    buildPlaylistPermalink({
                                        playlistId: message.sharedPlaylist.id,
                                        ownerHandle: message.sharedPlaylist.owner?.handle,
                                        slug: message.sharedPlaylist.slug,
                                    }),
                                )
                                : "",
                        ];

                        return (
                            <div key={message.id} className="flex gap-4">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-700">
                                    <Image
                                        src={avatarSrc}
                                        alt={avatarAlt}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK;
                                        }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex justify-between">
                                        <p className="font-bold text-white">
                                            {isMe ? "Me" : selected.participant.display_name}
                                        </p>
                                        <span className="text-xs text-zinc-500">
                                            {timeLabel(message.createdAt)}
                                        </span>
                                    </div>

                                    <MessageText text={message.text} hiddenUrls={hiddenSharedUrls} />

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
                        disabled={!selected.canMessage}
                        disabledReason={
                            selected.blockReason ||
                            (selected.isBlockedByMe
                                ? "You blocked this user. Unblock them to send messages."
                                : selected.hasBlockedMe
                                    ? "You cannot message this user."
                                    : "Messaging is unavailable for this conversation.")
                        }
                        onSend={(text, attachment) =>
                            sendMessage(selected.participant.id, text, attachment)
                        }
                    />
                </div>
            </div>
        </section>
    );
}