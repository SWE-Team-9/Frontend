import { create } from "zustand";
import { messageService } from "@/src/services/messageService";
import {
  connectMessageSocket,
  disconnectMessageSocket,
} from "@/src/services/messageSocketService";
import type {
  AttachResource,
  ConversationPreview,
  Message,
  MessageUser,
} from "@/src/types/messages";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

type SocketNewMessagePayload = {
  type: string;
  conversationId: string;
  message: Message;
  currentUnreadCount?: number;
};

type SocketMessageDeletedPayload = {
  conversationId: string;
  messageId: string;
};

type SocketConversationReadPayload = {
  conversationId: string;
  userId: string;
};

type SocketUnreadCountPayload = {
  unreadCount: number;
};

type SocketConversationUpdatedPayload = {
  conversationId: string;
};

function normalizeMessagesForDisplay(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function moveConversationToTop(
  conversations: ConversationPreview[],
  conversation: ConversationPreview,
) {
  return [
    conversation,
    ...conversations.filter(
      (c) => c.conversationId !== conversation.conversationId,
    ),
  ];
}

interface MessageState {
  conversationView: "active" | "archived";
  conversations: ConversationPreview[];
  dropdownConversations: ConversationPreview[];
  selectedConversation: ConversationPreview | null;
  messages: Message[];
  page: number;
  hasMore: boolean;
  unreadCount: number;
  isLoading: boolean;
  isLoadingOlder: boolean;
  isSending: boolean;
  isNewMessageOpen: boolean;
  isSocketConnected: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  loadDropdownConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (
    receiverId: string,
    text: string,
    attachment?: AttachResource | null,
  ) => Promise<void>;
  markUnread: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  openDirectConversation: (user: MessageUser) => Promise<void>;
  setNewMessageOpen: (open: boolean) => void;
  unarchiveConversation: (conversationId: string) => Promise<void>;
  setConversationView: (view: "active" | "archived") => Promise<void>;

  connectSocket: () => void;
  disconnectSocket: () => void;
  handleSocketNewMessage: (payload: SocketNewMessagePayload) => void;
  handleSocketMessageDeleted: (payload: SocketMessageDeletedPayload) => void;
  handleSocketConversationRead: (payload: SocketConversationReadPayload) => void;
  handleSocketUnreadCountUpdated: (payload: SocketUnreadCountPayload) => void;
  handleSocketConversationUpdated: (payload: SocketConversationUpdatedPayload) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversationView: "active",
  conversations: [],
  dropdownConversations: [],
  selectedConversation: null,
  messages: [],
  page: 1,
  hasMore: false,
  unreadCount: 0,
  isLoading: false,
  isLoadingOlder: false,
  isSending: false,
  isNewMessageOpen: false,
  isSocketConnected: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });

    try {
      const archived = get().conversationView === "archived";
      const data = await messageService.getConversations(1, 20, archived);

      set({ conversations: data.conversations });
    } catch {
      set({ error: "Could not load conversations." });
    } finally {
      set({ isLoading: false });
    }
  },

  setConversationView: async (view) => {
    set({
      conversationView: view,
      selectedConversation: null,
      messages: [],
      page: 1,
      hasMore: false,
    });

    await get().loadConversations();
  },

  loadDropdownConversations: async () => {
    try {
      const data = await messageService.getConversations(1, 5, false);
      set({ dropdownConversations: data.conversations });
    } catch {
      set({ dropdownConversations: [] });
    }
  },

  loadUnreadCount: async () => {
    try {
      const data = await messageService.getUnreadCount();
      set({ unreadCount: data.count });
    } catch {
      set({ unreadCount: 0 });
    }
  },

  openConversation: async (conversationId: string) => {
    set({ isLoading: true, error: null, page: 1 });

    try {
      const data = await messageService.getConversationMessages(
        conversationId,
        1,
        10,
      );

      await messageService.markConversationRead(conversationId);

      const normalizedMessages = normalizeMessagesForDisplay(data.messages);
      const lastMessage =
        normalizedMessages[normalizedMessages.length - 1] ?? null;

      const conversation =
        get().conversations.find((c) => c.conversationId === conversationId) ??
        get().dropdownConversations.find(
          (c) => c.conversationId === conversationId,
        ) ??
        null;

      const updatedConversation: ConversationPreview = conversation
        ? {
            ...conversation,
            lastMessage,
            updatedAt: lastMessage?.createdAt ?? conversation.updatedAt,
            unreadCount: 0,
            isBlockedByMe: data.isBlockedByMe,
            hasBlockedMe: data.hasBlockedMe,
            canMessage: data.canMessage,
            blockReason: data.blockReason,
          }
        : {
            conversationId,
            participant: data.participant,
            lastMessage,
            unreadCount: 0,
            updatedAt: lastMessage?.createdAt ?? new Date().toISOString(),
            isArchived: false,
            isBlockedByMe: data.isBlockedByMe,
            hasBlockedMe: data.hasBlockedMe,
            canMessage: data.canMessage,
            blockReason: data.blockReason,
          };

      set((state) => ({
        selectedConversation: updatedConversation,
        messages: normalizedMessages,
        hasMore: data.hasMore,
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId ? updatedConversation : c,
        ),
        dropdownConversations: state.dropdownConversations.map((c) =>
          c.conversationId === conversationId ? updatedConversation : c,
        ),
      }));

      await get().loadUnreadCount();
    } catch {
      set({ error: "Could not open conversation." });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOlderMessages: async () => {
    const selected = get().selectedConversation;
    if (!selected || !get().hasMore || get().isLoadingOlder) return;

    const nextPage = get().page + 1;
    set({ isLoadingOlder: true });

    try {
      const data = await messageService.getConversationMessages(
        selected.conversationId,
        nextPage,
        10,
      );

      const olderMessages = normalizeMessagesForDisplay(data.messages);

      set((state) => {
        const existingIds = new Set(state.messages.map((m) => m.id));
        const dedupedOlder = olderMessages.filter((m) => !existingIds.has(m.id));

        return {
          messages: [...dedupedOlder, ...state.messages],
          page: nextPage,
          hasMore: data.hasMore,
        };
      });
    } finally {
      set({ isLoadingOlder: false });
    }
  },

  sendMessage: async (receiverId, text, attachment) => {
    const cleanText = text.trim();
    if (!receiverId || !cleanText) return;

    set({ isSending: true, error: null });

    try {
      const result =
        attachment?.type === "TRACK"
          ? await messageService.shareTrack(receiverId, attachment.id, cleanText)
          : attachment?.type === "PLAYLIST"
            ? await messageService.sharePlaylist(
                receiverId,
                attachment.id,
                cleanText,
              )
            : await messageService.sendTextMessage(receiverId, cleanText);

      set((state) => {
        const exists = state.messages.some((m) => m.id === result.message.id);
        const isCurrent =
          state.selectedConversation?.conversationId ===
          result.conversation.conversationId;

        return {
          selectedConversation: isCurrent
            ? result.conversation
            : state.selectedConversation,
          messages:
            isCurrent && !exists
              ? normalizeMessagesForDisplay([...state.messages, result.message])
              : state.messages,
          conversations: moveConversationToTop(
            state.conversations,
            result.conversation,
          ),
          dropdownConversations: moveConversationToTop(
            state.dropdownConversations,
            result.conversation,
          ).slice(0, 5),
        };
      });

      await get().loadUnreadCount();
    } catch {
      set({ error: "Could not send message." });
    } finally {
      set({ isSending: false });
    }
  },

  markUnread: async (conversationId) => {
    await messageService.markConversationUnread(conversationId);

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: Math.max(1, c.unreadCount) }
          : c,
      ),
      dropdownConversations: state.dropdownConversations.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: Math.max(1, c.unreadCount) }
          : c,
      ),
    }));

    await get().loadUnreadCount();
  },

  archiveConversation: async (conversationId) => {
    await messageService.archiveConversation(conversationId);

    set((state) => ({
      conversations: state.conversations.filter(
        (c) => c.conversationId !== conversationId,
      ),
      dropdownConversations: state.dropdownConversations.filter(
        (c) => c.conversationId !== conversationId,
      ),
      selectedConversation:
        state.selectedConversation?.conversationId === conversationId
          ? null
          : state.selectedConversation,
      messages:
        state.selectedConversation?.conversationId === conversationId
          ? []
          : state.messages,
    }));
  },

  unarchiveConversation: async (conversationId) => {
    await messageService.unarchiveConversation(conversationId);

    set((state) => ({
      conversations: state.conversations.filter(
        (c) => c.conversationId !== conversationId,
      ),
      selectedConversation:
        state.selectedConversation?.conversationId === conversationId
          ? null
          : state.selectedConversation,
      messages:
        state.selectedConversation?.conversationId === conversationId
          ? []
          : state.messages,
    }));
  },

  openDirectConversation: async (user) => {
    const conversation = await messageService.getOrCreateDirectConversation(
      user.id,
    );

    set((state) => ({
      conversations: moveConversationToTop(state.conversations, conversation),
      isNewMessageOpen: false,
    }));

    await get().openConversation(conversation.conversationId);
  },

  setNewMessageOpen: (open) => set({ isNewMessageOpen: open }),

  connectSocket: () => {
    if (USE_MOCK) return;

    const socket = connectMessageSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("new_message");
    socket.off("message_deleted");
    socket.off("conversation_read");
    socket.off("unread_count_updated");
    socket.off("conversation_updated");

    socket.on("connect", () => {
      set({ isSocketConnected: true });
      void get().loadUnreadCount();
      void get().loadConversations();
      void get().loadDropdownConversations();
    });

    socket.on("disconnect", () => {
      set({ isSocketConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("Message socket connection failed:", error.message);
      set({ isSocketConnected: false });
    });

    socket.on("new_message", (payload: SocketNewMessagePayload) => {
      get().handleSocketNewMessage(payload);
    });

    socket.on("message_deleted", (payload: SocketMessageDeletedPayload) => {
      get().handleSocketMessageDeleted(payload);
    });

    socket.on("conversation_read", (payload: SocketConversationReadPayload) => {
      get().handleSocketConversationRead(payload);
    });

    socket.on("unread_count_updated", (payload: SocketUnreadCountPayload) => {
      get().handleSocketUnreadCountUpdated(payload);
    });

    socket.on(
      "conversation_updated",
      (payload: SocketConversationUpdatedPayload) => {
        get().handleSocketConversationUpdated(payload);
      },
    );
  },

  disconnectSocket: () => {
    disconnectMessageSocket();
    set({ isSocketConnected: false });
  },

  handleSocketNewMessage: (payload) => {
    const { conversationId, message } = payload;

    set((state) => {
      const isCurrent =
        state.selectedConversation?.conversationId === conversationId;

      const exists = state.messages.some((m) => m.id === message.id);

      const existingConversation =
        state.conversations.find((c) => c.conversationId === conversationId) ??
        state.dropdownConversations.find(
          (c) => c.conversationId === conversationId,
        ) ??
        state.selectedConversation;

      const shouldIncrementUnread = !isCurrent && message.senderId !== "me";

      const updatedConversation = existingConversation
        ? {
            ...existingConversation,
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount: shouldIncrementUnread
              ? existingConversation.unreadCount + 1
              : existingConversation.unreadCount,
          }
        : null;

      return {
        messages:
          isCurrent && !exists
            ? normalizeMessagesForDisplay([...state.messages, message])
            : state.messages,
        selectedConversation:
          isCurrent && updatedConversation
            ? { ...updatedConversation, unreadCount: 0 }
            : state.selectedConversation,
        conversations:
          updatedConversation && state.conversationView === "active"
            ? moveConversationToTop(state.conversations, updatedConversation)
            : state.conversations,
        dropdownConversations: updatedConversation
          ? moveConversationToTop(
              state.dropdownConversations,
              updatedConversation,
            ).slice(0, 5)
          : state.dropdownConversations,
      };
    });

    if (get().selectedConversation?.conversationId === conversationId) {
      void messageService.markConversationRead(conversationId);
    }

    void get().loadUnreadCount();
  },

  handleSocketMessageDeleted: ({ conversationId, messageId }) => {
    set((state) => ({
      messages:
        state.selectedConversation?.conversationId === conversationId
          ? state.messages.filter((m) => m.id !== messageId)
          : state.messages,
      conversations: state.conversations.map((c) =>
        c.lastMessage?.id === messageId ? { ...c, lastMessage: null } : c,
      ),
      dropdownConversations: state.dropdownConversations.map((c) =>
        c.lastMessage?.id === messageId ? { ...c, lastMessage: null } : c,
      ),
    }));
  },

  handleSocketConversationRead: ({ conversationId }) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
      dropdownConversations: state.dropdownConversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
      selectedConversation:
        state.selectedConversation?.conversationId === conversationId
          ? { ...state.selectedConversation, unreadCount: 0 }
          : state.selectedConversation,
    }));

    void get().loadUnreadCount();
  },

  handleSocketUnreadCountUpdated: ({ unreadCount }) => {
    set({ unreadCount });
  },

  handleSocketConversationUpdated: async () => {
    await get().loadConversations();
    await get().loadDropdownConversations();
    await get().loadUnreadCount();
  },
}));