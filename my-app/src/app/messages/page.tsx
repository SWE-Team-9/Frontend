"use client";

import { useEffect } from "react";
import NavBar from "@/src/components/ui/NavBar";
import ConversationList from "@/src/components/messages/ConversationList";
import ChatWindow from "@/src/components/messages/ChatWindow";
import NewMessageModal from "@/src/components/messages/NewMessageModal";
import { useMessageStore } from "@/src/store/messageStore";

export default function MessagesPage() {
  const loadConversations = useMessageStore((s) => s.loadConversations);
  const isNewMessageOpen = useMessageStore((s) => s.isNewMessageOpen);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-[#121212] pt-16 text-white">
        <div className="mx-auto flex max-w-7xl">
          <ConversationList />
          <ChatWindow />
        </div>

        {isNewMessageOpen && <NewMessageModal />}
      </main>
    </>
  );
}