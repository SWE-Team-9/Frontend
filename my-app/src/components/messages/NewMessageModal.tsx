"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getFollowing, FollowUser } from "@/src/services/followService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessageStore } from "@/src/store/messageStore";
import MessageComposer from "@/src/components/messages/MessageComposer";

const FALLBACK = "/images/profile.png";

export default function NewMessageModal() {
    const userId = useAuthStore((s) => s.user?.id);
    const setNewMessageOpen = useMessageStore((s) => s.setNewMessageOpen);
    const sendMessage = useMessageStore((s) => s.sendMessage);
    const loadConversations = useMessageStore((s) => s.loadConversations);

    const [following, setFollowing] = useState<FollowUser[]>([]);
    const [query, setQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<FollowUser | null>(null);
    const [isFollowingLoading, setIsFollowingLoading] = useState<boolean>(
        !!useAuthStore.getState().user?.id
    );
    const [followingError, setFollowingError] = useState<string | null>(null);


    useEffect(() => {
        if (!userId) return;

        let isMounted = true;

        (async () => {
            setIsFollowingLoading(true);

            try {
                const res = await getFollowing(userId, 1, 50);

                if (!isMounted) return;

                setFollowing(res.following ?? []);
                setFollowingError(null);
            } catch {
                if (isMounted) {
                    setFollowingError("Could not load the users you follow.");
                }
            } finally {
                if (isMounted) {
                    setIsFollowingLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const filtered = useMemo(() => {
        if (!query.trim()) return following;
        return following.filter((u) =>
            `${u.display_name} ${u.handle}`.toLowerCase().includes(query.toLowerCase()),
        );
    }, [following, query]);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
            <div className="relative w-full max-w-2xl rounded border border-zinc-700 bg-[#121212] p-5 text-white shadow-2xl">
                <button
                    onClick={() => setNewMessageOpen(false)}
                    className="absolute right-4 top-4 text-zinc-400 hover:text-white"
                >
                    <X />
                </button>

                <h2 className="mb-8 text-2xl font-bold">New message</h2>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-bold">
                        To <span className="text-red-500">*</span>
                    </label>

                    {selectedUser ? (
                        <div className="flex w-fit items-center gap-2 rounded bg-zinc-900 px-3 py-2">
                            <Image
                                src={selectedUser.avatar_url || FALLBACK}
                                alt={selectedUser.display_name}
                                width={22}
                                height={22}
                                className="rounded-full"
                            />
                            <span className="text-sm font-bold">{selectedUser.display_name}</span>
                            <button onClick={() => setSelectedUser(null)}>×</button>
                        </div>
                    ) : (
                        <>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full rounded border border-zinc-600 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-white"
                            />

                            {query && (
                                <div className="mt-2 max-h-44 overflow-y-auto rounded border border-zinc-700 bg-[#1e1e1e]">
                                    {isFollowingLoading && (
                                        <p className="px-3 py-2 text-sm text-zinc-500">
                                            Loading followed users...
                                        </p>
                                    )}

                                    {followingError && !isFollowingLoading && (
                                        <p className="px-3 py-2 text-sm text-red-300">
                                            {followingError}
                                        </p>
                                    )}

                                    {!isFollowingLoading && !followingError && following.length === 0 && (
                                        <p className="px-3 py-2 text-sm text-zinc-500">
                                            You are not following anyone yet.
                                        </p>
                                    )}

                                    {!isFollowingLoading &&
                                        !followingError &&
                                        following.length > 0 &&
                                        filtered.length === 0 && (
                                            <p className="px-3 py-2 text-sm text-zinc-500">
                                                No followed users match your search.
                                            </p>
                                        )}

                                    {!isFollowingLoading &&
                                        !followingError &&
                                        filtered.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setQuery("");
                                                }}
                                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800"
                                            >
                                                <Image
                                                    src={u.avatar_url || FALLBACK}
                                                    alt={u.display_name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                                <span className="text-sm font-bold">{u.display_name}</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <MessageComposer
                    receiverId={selectedUser?.id ?? ""}
                    onSend={async (text, attachment) => {
                        if (!selectedUser) return;
                        await sendMessage(selectedUser.id, text, attachment);
                        await loadConversations();
                        setNewMessageOpen(false);
                    }}
                />
            </div>
        </div>
    );
}