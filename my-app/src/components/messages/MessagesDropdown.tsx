"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ConversationPreview from "@/src/components/messages/ConversationPreview";
import { useMessageStore } from "@/src/store/messageStore";

export default function MessagesDropdown() {
  const router = useRouter();
  const conversations = useMessageStore((s) => s.dropdownConversations);
  const loadDropdownConversations = useMessageStore((s) => s.loadDropdownConversations);
  const openConversation = useMessageStore((s) => s.openConversation);

  useEffect(() => {
    loadDropdownConversations();
  }, [loadDropdownConversations]);

  return (
    <div className="absolute right-0 top-10 z-50 w-[400px] rounded border border-zinc-800 bg-[#121212] p-4 shadow-xl">
      <h2 className="mb-3 text-xl font-bold text-white">Messages</h2>

      <div className="space-y-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-zinc-400">No messages</p>
        ) : (
          conversations.map((conversation) => (
            <ConversationPreview
              key={conversation.conversationId}
              conversation={conversation}
              onClick={async () => {
                await openConversation(conversation.conversationId);
                router.push("/messages");
              }}
            />
          ))
        )}
      </div>

      <button
        onClick={() => router.push("/messages")}
        className="mt-4 w-full py-2 text-center text-sm font-bold text-white hover:underline"
      >
        View all messages
      </button>
    </div>
  );
}