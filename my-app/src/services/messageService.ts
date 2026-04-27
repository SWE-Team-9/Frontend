import api from "@/src/services/api";
import type {
  AttachResource,
  ConversationMessagesResponse,
  ConversationPreview,
  ConversationsResponse,
  Message,
  MessageUser,
  SendMessageResponse,
  SharedPlaylist,
  SharedTrack,
  UnreadCountResponse,
} from "@/src/types/messages";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const meId = "me";

const mockUsers: MessageUser[] = [
  { id: "usr_1", display_name: "Baymax", handle: "baymax", avatar_url: "/images/profile.png" },
  { id: "usr_2", display_name: "Patrik Fehér", handle: "patrik", avatar_url: "/images/profile.png" },
  { id: "usr_3", display_name: "Fall Out Boy", handle: "fall-out-boy", avatar_url: "/images/profile.png" },
  { id: "usr_4", display_name: "Menna Hesham", handle: "menna", avatar_url: "/images/profile.png" },
];

const mockTrack: SharedTrack = {
  id: "trk_mock_1",
  title: "Panic! At The Disco - House Of Memories",
  slug: "panic-at-the-disco-house-of-memories",
  artist: { id: "usr_artist", display_name: "Quality", handle: "quality", avatar_url: null },
  coverArtUrl: "/images/track-placeholder.png",
  durationSeconds: 198,
  waveformData: [0.2, 0.4, 0.3, 0.8, 0.5],
  playCount: 12345,
  commentsCount: 12,
  likesCount: 240,
  repostsCount: 15,
  liked: false,
  reposted: false,
  createdAt: new Date().toISOString(),
};

const mockPlaylistTracks: SharedTrack[] = [
  mockTrack,
  {
    id: "trk_mock_2",
    title: "Warriors - Imagine Dragons",
    slug: "warriors-imagine-dragons",
    artist: { id: "usr_10", display_name: "Oofie", handle: "oofie", avatar_url: null },
    coverArtUrl: "/images/track-placeholder.png",
    durationSeconds: 156,
    waveformData: [0.1, 0.4, 0.7, 0.3],
    playCount: 2450000,
    commentsCount: 80,
    likesCount: 1200,
    repostsCount: 90,
    liked: false,
    reposted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trk_mock_3",
    title: "Centuries - Fall Out Boy",
    slug: "centuries-fall-out-boy",
    artist: { id: "usr_3", display_name: "Fall Out Boy", handle: "fall-out-boy", avatar_url: null },
    coverArtUrl: "/images/track-placeholder.png",
    durationSeconds: 228,
    waveformData: [0.2, 0.5, 0.9, 0.4],
    playCount: 5330000,
    commentsCount: 160,
    likesCount: 3200,
    repostsCount: 210,
    liked: true,
    reposted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trk_mock_4",
    title: "The Phoenix",
    slug: "the-phoenix",
    artist: { id: "usr_3", display_name: "Fall Out Boy", handle: "fall-out-boy", avatar_url: null },
    coverArtUrl: "/images/track-placeholder.png",
    durationSeconds: 244,
    waveformData: [0.3, 0.6, 0.8, 0.2],
    playCount: 870000,
    commentsCount: 44,
    likesCount: 760,
    repostsCount: 55,
    liked: false,
    reposted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trk_mock_5",
    title: "Immortals",
    slug: "immortals",
    artist: { id: "usr_3", display_name: "Fall Out Boy", handle: "fall-out-boy", avatar_url: null },
    coverArtUrl: "/images/track-placeholder.png",
    durationSeconds: 189,
    waveformData: [0.4, 0.8, 0.5, 0.7],
    playCount: 771000,
    commentsCount: 63,
    likesCount: 980,
    repostsCount: 71,
    liked: false,
    reposted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trk_mock_6",
    title: "Runnin'",
    slug: "runnin",
    artist: { id: "usr_11", display_name: "Adam Lambert", handle: "adam-lambert", avatar_url: null },
    coverArtUrl: "/images/track-placeholder.png",
    durationSeconds: 205,
    waveformData: [0.2, 0.3, 0.9, 0.6],
    playCount: 405000,
    commentsCount: 29,
    likesCount: 510,
    repostsCount: 36,
    liked: false,
    reposted: false,
    createdAt: new Date().toISOString(),
  },
];

const mockPlaylist: SharedPlaylist = {
  id: "pl_mock_1",
  title: "Testing",
  slug: "testing",
  owner: {
    id: meId,
    display_name: "Maryam Soliman",
    handle: "maryamsol37",
    avatar_url: null,
  },
  coverArtUrl: "/images/track-placeholder.png",
  tracksCount: mockPlaylistTracks.length,
  tracksPreview: mockPlaylistTracks.slice(0, 5),
};

let mockMessages: Message[] = [
  {
    id: "msg_1",
    conversationId: "conv_1",
    senderId: "usr_1",
    receiverId: meId,
    type: "TEXT",
    text: "hi",
    isRead: false,
    createdAt: new Date(Date.now() - 60_000 * 9).toISOString(),
  },
  {
    id: "msg_2",
    conversationId: "conv_1",
    senderId: meId,
    receiverId: "usr_1",
    type: "PLAYLIST_SHARE",
    text: "Module 7: Sets & Playlists\nhttps://iqa3.tech/maryamsol37/sets/testing",
    isRead: true,
    createdAt: new Date(Date.now() - 60_000 * 2).toISOString(),
    sharedPlaylist: mockPlaylist,
  },
  {
    id: "msg_3",
    conversationId: "conv_4",
    senderId: "usr_4",
    receiverId: meId,
    type: "TEXT",
    text: "helloooooooo",
    isRead: true,
    createdAt: new Date(Date.now() - 60_000 * 58).toISOString(),
  },
];

let mockConversations: ConversationPreview[] = [
  {
    conversationId: "conv_1",
    participant: mockUsers[0],
    lastMessage: mockMessages[1],
    unreadCount: 1,
    updatedAt: mockMessages[1].createdAt,
    isArchived: false,
    isBlockedByMe: false,
    hasBlockedMe: false,
    canMessage: true,
    blockReason: null,
  },
  {
    conversationId: "conv_2",
    participant: mockUsers[1],
    lastMessage: {
      id: "msg_p",
      conversationId: "conv_2",
      senderId: "usr_2",
      receiverId: meId,
      type: "TEXT",
      text: "hi",
      isRead: true,
      createdAt: new Date(Date.now() - 60_000 * 12).toISOString(),
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 60_000 * 12).toISOString(),
    isArchived: false,
    isBlockedByMe: false,
    hasBlockedMe: false,
    canMessage: true,
    blockReason: null,
  },
  {
    conversationId: "conv_3",
    participant: mockUsers[2],
    lastMessage: {
      id: "msg_f",
      conversationId: "conv_3",
      senderId: "usr_3",
      receiverId: meId,
      type: "TEXT",
      text: "hi",
      isRead: true,
      createdAt: new Date(Date.now() - 60_000 * 13).toISOString(),
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 60_000 * 13).toISOString(),
    isArchived: false,
    isBlockedByMe: false,
    hasBlockedMe: false,
    canMessage: true,
    blockReason: null,
  },
  {
    conversationId: "conv_4",
    participant: mockUsers[3],
    lastMessage: mockMessages[2],
    unreadCount: 0,
    updatedAt: mockMessages[2].createdAt,
    isArchived: false,
    isBlockedByMe: false,
    hasBlockedMe: false,
    canMessage: true,
    blockReason: null,
  },
];

function getMockUnreadCount() {
  return mockConversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

function upsertConversationAfterMessage(message: Message, participant: MessageUser) {
  const index = mockConversations.findIndex((c) => c.conversationId === message.conversationId);
  const next: ConversationPreview = {
    conversationId: message.conversationId,
    participant,
    lastMessage: message,
    unreadCount: 0,
    updatedAt: message.createdAt,
    isArchived: false,
    isBlockedByMe: false,
    hasBlockedMe: false,
    canMessage: true,
    blockReason: null,
  };

  if (index >= 0) mockConversations[index] = { ...mockConversations[index], ...next };
  else mockConversations.unshift(next);

  return next;
}

export const messageService = {
  async getConversations(page = 1, limit = 20, archived = false): Promise<ConversationsResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 250));
      const filtered = mockConversations.filter((c) => c.isArchived === archived);
      return {
        page,
        limit,
        total: filtered.length,
        conversations: filtered.slice((page - 1) * limit, page * limit),
      };
    }

    const res = await api.get("/messages/conversations", {
      params: { page, limit, archived },
    });
    return res.data;
  },

  async getConversationMessages(conversationId: string, page = 1, limit = 10): Promise<ConversationMessagesResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 250));
      const conversation = mockConversations.find((c) => c.conversationId === conversationId);
      const all = mockMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const start = Math.max(0, all.length - page * limit);
      const end = all.length - (page - 1) * limit;
      const pageMessages = all.slice(start, end);

      return {
        conversationId,
        participant: conversation?.participant ?? mockUsers[0],
        page,
        limit,
        total: all.length,
        hasMore: start > 0,
        messages: pageMessages,
        isBlockedByMe: conversation?.isBlockedByMe ?? false,
        hasBlockedMe: conversation?.hasBlockedMe ?? false,
        canMessage: conversation?.canMessage ?? true,
        blockReason: conversation?.blockReason ?? null,
      };
    }

    const res = await api.get(`/messages/conversations/${conversationId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  async getOrCreateDirectConversation(receiverId: string): Promise<ConversationPreview> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const existing = mockConversations.find((c) => c.participant.id === receiverId);
      if (existing) return existing;

      const user = mockUsers.find((u) => u.id === receiverId) ?? {
        id: receiverId,
        display_name: "New User",
        avatar_url: null,
      };

      const conversation: ConversationPreview = {
        conversationId: `conv_${Date.now()}`,
        participant: user,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        isArchived: false,
        isBlockedByMe: false,
        hasBlockedMe: false,
        canMessage: true,
        blockReason: null,
      };

      mockConversations.unshift(conversation);
      return conversation;
    }

    const res = await api.post("/messages/conversations/direct", { receiverId });
    return res.data;
  },

  async sendTextMessage(receiverId: string, text: string): Promise<SendMessageResponse> {
    if (USE_MOCK) {
      const conversation = await this.getOrCreateDirectConversation(receiverId);
      const message: Message = {
        id: `msg_${Date.now()}`,
        conversationId: conversation.conversationId,
        senderId: meId,
        receiverId,
        type: "TEXT",
        text,
        isRead: true,
        createdAt: new Date().toISOString(),
      };

      mockMessages.push(message);
      const updatedConversation = upsertConversationAfterMessage(message, conversation.participant);

      return { message, conversation: updatedConversation, currentUnreadCount: getMockUnreadCount() };
    }

    const res = await api.post("/messages", { receiverId, text });
    return res.data;
  },

  async shareTrack(receiverId: string, trackId: string, text: string): Promise<SendMessageResponse> {
    if (USE_MOCK) {
      const conversation = await this.getOrCreateDirectConversation(receiverId);
      const message: Message = {
        id: `msg_${Date.now()}`,
        conversationId: conversation.conversationId,
        senderId: meId,
        receiverId,
        type: "TRACK_SHARE",
        text,
        isRead: true,
        createdAt: new Date().toISOString(),
        sharedTrack: { ...mockTrack, id: trackId },
      };

      mockMessages.push(message);
      const updatedConversation = upsertConversationAfterMessage(message, conversation.participant);

      return { message, conversation: updatedConversation, currentUnreadCount: getMockUnreadCount() };
    }

    const res = await api.post("/messages/share/track", { receiverId, trackId, text });
    return res.data;
  },

  async sharePlaylist(receiverId: string, playlistId: string, text: string): Promise<SendMessageResponse> {
    if (USE_MOCK) {
      const conversation = await this.getOrCreateDirectConversation(receiverId);
      const message: Message = {
        id: `msg_${Date.now()}`,
        conversationId: conversation.conversationId,
        senderId: meId,
        receiverId,
        type: "PLAYLIST_SHARE",
        text,
        isRead: true,
        createdAt: new Date().toISOString(),
        sharedPlaylist: { ...mockPlaylist, id: playlistId },
      };

      mockMessages.push(message);
      const updatedConversation = upsertConversationAfterMessage(message, conversation.participant);

      return { message, conversation: updatedConversation, currentUnreadCount: getMockUnreadCount() };
    }

    const res = await api.post("/messages/share/playlist", { receiverId, playlistId, text });
    return res.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    if (USE_MOCK) return { count: getMockUnreadCount() };
    const res = await api.get("/messages/unread-count");
    return res.data;
  },

  async markConversationRead(conversationId: string) {
    if (USE_MOCK) {
      mockConversations = mockConversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
      );
      mockMessages = mockMessages.map((m) =>
        m.conversationId === conversationId ? { ...m, isRead: true } : m,
      );
      return { message: "Conversation marked as read" };
    }

    const res = await api.patch(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },

  async markConversationUnread(conversationId: string) {
    if (USE_MOCK) {
      mockConversations = mockConversations.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: Math.max(1, c.unreadCount) }
          : c,
      );
      return { message: "Conversation marked as unread", unreadCount: getMockUnreadCount() };
    }

    const res = await api.patch(`/messages/conversations/${conversationId}/unread`);
    return res.data;
  },

  async archiveConversation(conversationId: string) {
    if (USE_MOCK) {
      mockConversations = mockConversations.map((c) =>
        c.conversationId === conversationId ? { ...c, isArchived: true } : c,
      );
      return { message: "Conversation archived successfully" };
    }

    const res = await api.patch(`/messages/conversations/${conversationId}/archive`);
    return res.data;
  },

  async unarchiveConversation(conversationId: string) {
    if (USE_MOCK) {
      mockConversations = mockConversations.map((c) =>
        c.conversationId === conversationId ? { ...c, isArchived: false } : c,
      );
      return { message: "Conversation unarchived successfully" };
    }

    const res = await api.patch(`/messages/conversations/${conversationId}/unarchive`);
    return res.data;
  },

  async deleteMessage(messageId: string) {
    if (USE_MOCK) {
      mockMessages = mockMessages.filter((m) => m.id !== messageId);
      return { message: "Message deleted successfully" };
    }

    const res = await api.delete(`/messages/${messageId}`);
    return res.data;
  },

    async getPlaylistDetailsForSharing(playlistId: string): Promise<SharedPlaylist> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));

        return {
        ...mockPlaylist,
        id: playlistId,
        tracksCount: mockPlaylistTracks.length,
        tracksPreview: mockPlaylistTracks,
        };
    }

    const res = await api.get(`/playlists/${playlistId}`);

    return {
        id: res.data.playlistId ?? res.data.id,
        title: res.data.title,
        slug: res.data.slug,
        owner: {
        id: res.data.owner.id,
        display_name: res.data.owner.display_name,
        handle: res.data.owner.handle,
        avatar_url: res.data.owner.avatar_url ?? null,
        },
        coverArtUrl: res.data.coverArtUrl ?? null,
        tracksCount: res.data.tracks?.length ?? 0,
        tracksPreview: (res.data.tracks ?? []).map((track: any) => ({
        id: track.id ?? track.trackId,
        title: track.title,
        slug: track.slug,
        artist: {
            id: track.artist?.id ?? track.artistId ?? "unknown",
            display_name:
            track.artist?.display_name ??
            track.artistName ??
            "Unknown Artist",
            handle: track.artist?.handle ?? track.artistHandle ?? "",
            avatar_url: track.artist?.avatar_url ?? null,
        },
        coverArtUrl: track.coverArtUrl ?? track.coverArt ?? null,
        durationSeconds: track.durationSeconds ?? 0,
        waveformData: track.waveformData ?? [],
        playCount: track.playCount ?? 0,
        commentsCount: track.commentsCount ?? 0,
        likesCount: track.likesCount ?? 0,
        repostsCount: track.repostsCount ?? 0,
        liked: track.liked ?? false,
        reposted: track.reposted ?? false,
        createdAt: track.createdAt ?? new Date().toISOString(),
        })),
    };
    },

  async getMockAttachResources(): Promise<AttachResource[]> {
    return [
      {
        type: "TRACK",
        id: "trk_mock_1",
        title: "Panic! At The Disco - House Of Memories",
        permalink: "https://iqa3.tech/user-582410143/panic-at-the-disco-house-of-memories",
        coverArtUrl: "/images/track-placeholder.png",
      },
      {
        type: "PLAYLIST",
        id: "pl_mock_1",
        title: "Testing",
        permalink: "https://iqa3.tech/maryamsol37/sets/testing",
        coverArtUrl: "/images/track-placeholder.png",
      },
    ];
  },
};