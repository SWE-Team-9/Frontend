"use client";

import ConversationPreview from "@/src/components/messages/ConversationPreview";
import { useMessageStore } from "@/src/store/messageStore";

export default function ConversationList() {
  const conversations = useMessageStore((s) => s.conversations);
  const selected = useMessageStore((s) => s.selectedConversation);
  const openConversation = useMessageStore((s) => s.openConversation);
  const setNewMessageOpen = useMessageStore((s) => s.setNewMessageOpen);

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
    </aside>
  );
}