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
import Link from "next/link";
import { useBlockStore } from "@/src/store/useblockStore";
import ConfirmModal from "@/src/components/block-user/ConfirmModal";
import { ReportModal } from "@/src/components/reports/ReportModal";

const FALLBACK = "/images/profile.png";

function timeLabel(date: string) {
    const messageDate = new Date(date);
    const now = new Date();

    const isToday = messageDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    const time = messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (isToday) return time;

    if (isYesterday) return `Yesterday, ${time}`;

    return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: messageDate.getFullYear() === now.getFullYear() ? undefined : "numeric",
    }) + `, ${time}`;
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
    const openConversation = useMessageStore((s) => s.openConversation);

    const {
        blockUser,
        unblockUser,
        blockedUsers,
        fetchBlockedUsers,
        loadingUserId,
    } = useBlockStore();

    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);


    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [selected?.conversationId]);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

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


    const participant = selected.participant;
    const isBlocked = selected.isBlockedByMe || blockedUsers.some((u) => u.id === participant.id);
    const isBlockLoading = loadingUserId === participant.id;

    const handleBlockConfirm = async () => {
        if (isBlocked) {
            await unblockUser(participant.id);
        } else {
            await blockUser(participant.id, {
                display_name: participant.display_name,
                handle: participant.handle,
                avatar_url: participant.avatar_url ?? "",
            });
        }

        setShowBlockConfirm(false);
        await openConversation(selected.conversationId);
    };

    return (
        <section className="flex h-[calc(100vh-64px)] flex-1 flex-col p-8">
            <header className="mb-6 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        {selected.participant.handle ? (
                            <Link
                                href={`/profiles/${selected.participant.handle}`}
                                className="text-lg font-bold hover:text-zinc-600 transition-colors"
                            >
                                {selected.participant.display_name}
                            </Link>
                        ) : (
                            <h2 className="text-lg font-bold">{selected.participant.display_name}</h2>
                        )}

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
                    <button
                        onClick={() => setShowBlockConfirm(true)}
                        disabled={isBlockLoading}
                        className="text-sm font-bold text-white hover:text-red-400 disabled:opacity-50"
                    >
                        {isBlockLoading ? "Processing..." : isBlocked ? "Unblock" : "Block"}
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="text-sm font-bold text-white hover:text-orange-400"
                    >
                        Report
                    </button>
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
                        const isMe = message.senderId === currentUser?.id;

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
                                        {!isMe && selected.participant.handle ? (
                                            <Link
                                                href={`/profiles/${selected.participant.handle}`}
                                                className="font-bold text-white hover:text-zinc-600 transition-colors"
                                            >
                                                {selected.participant.display_name}
                                            </Link>
                                        ) : (
                                            <p className="font-bold text-white">
                                                {isMe ? "Me" : selected.participant.display_name}
                                            </p>
                                        )}
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

            <ConfirmModal
                open={showBlockConfirm}
                onClose={() => setShowBlockConfirm(false)}
                onConfirm={handleBlockConfirm}
                displayName={participant.display_name}
                isBlocked={isBlocked}
            />

            {showReportModal && (
                <ReportModal
                    targetId={participant.id}
                    targetType="USER"
                    targetLabel={participant.display_name}
                    onClose={() => setShowReportModal(false)}
                />
            )}

        </section>
    );
}