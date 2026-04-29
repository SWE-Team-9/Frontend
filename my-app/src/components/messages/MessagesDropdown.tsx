"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ConversationPreview from "@/src/components/messages/ConversationPreview";
import { useMessageStore } from "@/src/store/messageStore";

export default function MessagesDropdown() {
  const router = useRouter();
  const conversations = useMessageStore((s) => s.dropdownConversations);
  const loadDropdownConversations = useMessageStore(
    (s) => s.loadDropdownConversations,
  );
  const openConversation = useMessageStore((s) => s.openConversation);

  useEffect(() => {
    loadDropdownConversations();
  }, [loadDropdownConversations]);

  return (
    <div className="absolute right-0 top-10 z-50 w-100 rounded border border-neutral-600 bg-[#121212] shadow-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-bold text-2xl">Messages</h3>
      </div>

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

      <div className="border-t border-neutral-800">
        <button
          onClick={() => router.push("/messages")}
          className="block w-full px-4 py-3 text-center text-sm font-semibold text-white hover:bg-neutral-800"
        >
          View all messages
        </button>
      </div>
    </div>
  );
}
