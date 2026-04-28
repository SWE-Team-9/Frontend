"use client";

import ConversationPreview from "@/src/components/messages/ConversationPreview";
import { useMessageStore } from "@/src/store/messageStore";

export default function ConversationList() {
  const conversations = useMessageStore((s) => s.conversations);
  const selected = useMessageStore((s) => s.selectedConversation);
  const isLoadingConversations = useMessageStore((s) => s.isLoadingConversations);
  const error = useMessageStore((s) => s.error);
  const conversationView = useMessageStore((s) => s.conversationView);

  const openConversation = useMessageStore((s) => s.openConversation);
  const loadConversations = useMessageStore((s) => s.loadConversations);
  const setNewMessageOpen = useMessageStore((s) => s.setNewMessageOpen);
  const setConversationView = useMessageStore((s) => s.setConversationView);

  return (
    <aside className="h-[calc(100vh-64px)] w-[380px] shrink-0 overflow-y-auto border-r border-zinc-800 p-5">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>

        <button
          onClick={() => setNewMessageOpen(true)}
          className="rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200"
        >
          New
        </button>
      </div>

      <div className="mb-4 flex rounded bg-zinc-900 p-1">
        <button
          onClick={() => setConversationView("active")}
          className={`flex-1 rounded px-3 py-2 text-sm font-bold ${
            conversationView === "active"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Active
        </button>

        <button
          onClick={() => setConversationView("archived")}
          className={`flex-1 rounded px-3 py-2 text-sm font-bold ${
            conversationView === "archived"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Archived
        </button>
      </div>

      {isLoadingConversations && conversations.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3 rounded px-4 py-3"
            >
              <div className="h-12 w-12 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-zinc-800" />
                <div className="h-3 w-44 rounded bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoadingConversations && conversations.length === 0 && (
        <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={loadConversations}
            className="mt-3 rounded bg-white px-4 py-2 text-sm font-bold text-black"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoadingConversations && !error && conversations.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg font-bold text-zinc-400">
            {conversationView === "active"
              ? "No active conversations."
              : "No archived conversations."}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {conversationView === "active"
              ? "Start a new message with someone you follow."
              : "Archived conversations will appear here."}
          </p>

          {conversationView === "active" && (
            <button
              onClick={() => setNewMessageOpen(true)}
              className="mt-5 rounded bg-white px-5 py-2 text-sm font-bold text-black hover:bg-zinc-200"
            >
              New message
            </button>
          )}
        </div>
      )}

      {conversations.length > 0 && (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationPreview
              key={conversation.conversationId}
              conversation={conversation}
              active={selected?.conversationId === conversation.conversationId}
              onClick={() => openConversation(conversation.conversationId)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}