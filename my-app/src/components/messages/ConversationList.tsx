"use client";

import ConversationPreview from "@/src/components/messages/ConversationPreview";
import { useMessageStore } from "@/src/store/messageStore";

export default function ConversationList() {
  const conversations = useMessageStore((s) => s.conversations);
  const selected = useMessageStore((s) => s.selectedConversation);
  const conversationView = useMessageStore((s) => s.conversationView);
  const openConversation = useMessageStore((s) => s.openConversation);
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

      <div className="space-y-1">
        {conversations.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            {conversationView === "active"
              ? "No active conversations."
              : "No archived conversations."}
          </p>
        ) : (
          conversations.map((conversation) => (
            <ConversationPreview
              key={conversation.conversationId}
              conversation={conversation}
              active={selected?.conversationId === conversation.conversationId}
              onClick={() => openConversation(conversation.conversationId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}