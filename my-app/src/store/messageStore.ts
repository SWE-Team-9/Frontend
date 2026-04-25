import { create } from "zustand";
import { messageService } from "@/src/services/messageService";
import type {
  AttachResource,
  ConversationPreview,
  Message,
  MessageUser,
} from "@/src/types/messages";

interface MessageState {
  conversations: ConversationPreview[];
  dropdownConversations: ConversationPreview[];
  selectedConversation: ConversationPreview | null;
  messages: Message[];
  page: number;
  hasMore: boolean;
  unreadCount: number;
  isLoading: boolean;
  isSending: boolean;
  isNewMessageOpen: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  loadDropdownConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (receiverId: string, text: string, attachment?: AttachResource | null) => Promise<void>;
  markUnread: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  openDirectConversation: (user: MessageUser) => Promise<void>;
  setNewMessageOpen: (open: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  dropdownConversations: [],
  selectedConversation: null,
  messages: [],
  page: 1,
  hasMore: false,
  unreadCount: 0,
  isLoading: false,
  isSending: false,
  isNewMessageOpen: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await messageService.getConversations(1, 20, false);
      set({ conversations: data.conversations });
    } catch {
      set({ error: "Could not load conversations." });
    } finally {
      set({ isLoading: false });
    }
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
      const data = await messageService.getConversationMessages(conversationId, 1, 10);
      await messageService.markConversationRead(conversationId);

      const conversation =
        get().conversations.find((c) => c.conversationId === conversationId) ??
        get().dropdownConversations.find((c) => c.conversationId === conversationId) ??
        null;

      const updatedConversation = conversation
        ? { ...conversation, unreadCount: 0 }
        : null;

      set((state) => ({
        selectedConversation: updatedConversation,
        messages: data.messages,
        hasMore: data.hasMore,
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
        dropdownConversations: state.dropdownConversations.map((c) =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
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
    if (!selected || !get().hasMore || get().isLoading) return;

    const nextPage = get().page + 1;
    set({ isLoading: true });

    try {
      const data = await messageService.getConversationMessages(selected.conversationId, nextPage, 10);
      set((state) => ({
        messages: [...data.messages, ...state.messages],
        page: nextPage,
        hasMore: data.hasMore,
      }));
    } finally {
      set({ isLoading: false });
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
            ? await messageService.sharePlaylist(receiverId, attachment.id, cleanText)
            : await messageService.sendTextMessage(receiverId, cleanText);

      set((state) => {
        const exists = state.messages.some((m) => m.id === result.message.id);
        const isCurrent = state.selectedConversation?.conversationId === result.conversation.conversationId;

        return {
          selectedConversation: isCurrent ? result.conversation : state.selectedConversation,
          messages: isCurrent && !exists ? [...state.messages, result.message] : state.messages,
          conversations: [
            result.conversation,
            ...state.conversations.filter((c) => c.conversationId !== result.conversation.conversationId),
          ],
          unreadCount: result.currentUnreadCount,
        };
      });
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
        c.conversationId === conversationId ? { ...c, unreadCount: Math.max(1, c.unreadCount) } : c,
      ),
    }));
    await get().loadUnreadCount();
  },

  archiveConversation: async (conversationId) => {
    await messageService.archiveConversation(conversationId);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.conversationId !== conversationId),
      selectedConversation:
        state.selectedConversation?.conversationId === conversationId ? null : state.selectedConversation,
      messages:
        state.selectedConversation?.conversationId === conversationId ? [] : state.messages,
    }));
  },

  openDirectConversation: async (user) => {
    const conversation = await messageService.getOrCreateDirectConversation(user.id);
    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter((c) => c.conversationId !== conversation.conversationId),
      ],
      isNewMessageOpen: false,
    }));
    await get().openConversation(conversation.conversationId);
  },

  setNewMessageOpen: (open) => set({ isNewMessageOpen: open }),
}));