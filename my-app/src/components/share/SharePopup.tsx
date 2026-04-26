"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Copy, Check, X } from "lucide-react";
import { getFollowing, FollowUser } from "@/src/services/followService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessageStore } from "@/src/store/messageStore";
import MessageComposer from "@/src/components/messages/MessageComposer";
import type { AttachResource, ShareResourceType } from "@/src/types/messages";

const FALLBACK = "/images/profile.png";

interface Props {
  permalink: string;
  onClose: () => void;

  // Optional: pass these when sharing a track/playlist so it sends as a card
  resourceType?: ShareResourceType;
  resourceId?: string;
  resourceTitle?: string;
  resourceCoverArtUrl?: string | null;
}

export default function SharePopup({
  permalink,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  resourceCoverArtUrl,
}: Props) {
  const [activeTab, setActiveTab] = useState<"Share" | "Message">("Share");
  const [copied, setCopied] = useState(false);

  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<FollowUser | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  const userId = useAuthStore((s) => s.user?.id);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const loadConversations = useMessageStore((s) => s.loadConversations);
  const loadUnreadCount = useMessageStore((s) => s.loadUnreadCount);

  // Build the full absolute URL the user will share
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${permalink}`
      : permalink;

  const initialAttachment: AttachResource | null =
    resourceType && resourceId
      ? {
        type: resourceType,
        id: resourceId,
        title: resourceTitle || "Shared item",
        permalink: fullUrl,
        coverArtUrl: resourceCoverArtUrl ?? null,
      }
      : null;

  useEffect(() => {
    if (!userId) return;

    getFollowing(userId, 1, 50)
      .then((res) => setFollowing(res.following ?? []))
      .catch(() => setFollowing([]));
  }, [userId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return following;

    return following.filter((u) =>
      `${u.display_name} ${u.handle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }, [following, query]);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const tmp = document.createElement("textarea");
      tmp.value = fullUrl;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div
        ref={ref}
        className={`relative max-h-[90vh] overflow-y-auto rounded-md border border-zinc-700 bg-[#121212] p-4 text-white shadow-xl ${activeTab === "Message" ? "w-full max-w-[560px]" : "w-full max-w-sm"
          }`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex gap-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("Share")}
            className={`pb-3 text-lg font-bold ${activeTab === "Share"
                ? "border-b-2 border-white text-white"
                : "text-zinc-500 hover:text-white"
              }`}
          >
            Share
          </button>

          <button
            onClick={() => setActiveTab("Message")}
            className={`pb-3 text-lg font-bold ${activeTab === "Message"
                ? "border-b-2 border-white text-white"
                : "text-zinc-500 hover:text-white"
              }`}
          >
            Message
          </button>
        </div>

        {activeTab === "Share" ? (
          <>
            <p className="mb-2 text-xs font-bold uppercase text-zinc-400">
              Share link
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 truncate rounded border border-zinc-700 bg-[#1e1e1e] px-2 py-1.5 text-xs text-white outline-none"
              />

              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition-colors ${copied
                    ? "bg-green-600 text-white"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-5">
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

                  <span className="text-sm font-bold">
                    {selectedUser.display_name}
                  </span>

                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ×
                  </button>
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
                      {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-zinc-500">
                          No followed users found
                        </p>
                      ) : (
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

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {u.display_name}
                              </p>
                              <p className="truncate text-xs text-zinc-500">
                                @{u.handle}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <MessageComposer
              receiverId={selectedUser?.id ?? ""}
              initialText={fullUrl}
              initialAttachment={initialAttachment}
              onSend={async (text, attachment) => {
                if (!selectedUser) return;

                await sendMessage(selectedUser.id, text, attachment);
                await loadConversations();
                await loadUnreadCount();
                onClose();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}