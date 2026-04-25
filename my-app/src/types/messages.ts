export type MessageType = "TEXT" | "TRACK_SHARE" | "PLAYLIST_SHARE";
export type ShareResourceType = "TRACK" | "PLAYLIST";

export interface MessageUser {
  id: string;
  display_name: string;
  handle?: string;
  avatar_url?: string | null;
}

export interface SharedTrack {
  id: string;
  title: string;
  permalink?: string;
  slug?: string;
  artist: MessageUser;
  coverArtUrl?: string | null;
  durationSeconds?: number;
  waveformData?: number[];
  playCount?: number;
  commentsCount?: number;
  likesCount?: number;
  repostsCount?: number;
  liked?: boolean;
  reposted?: boolean;
  createdAt?: string;
}

export interface SharedPlaylist {
  id: string;
  title: string;
  permalink?: string;
  slug?: string;
  owner: MessageUser;
  coverArtUrl?: string | null;
  tracksCount?: number;
  tracksPreview?: SharedTrack[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  text: string;
  isRead: boolean;
  createdAt: string;
  sharedTrack?: SharedTrack | null;
  sharedPlaylist?: SharedPlaylist | null;
}

export interface ConversationPreview {
  conversationId: string;
  participant: MessageUser;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
  isArchived: boolean;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  canMessage: boolean;
  blockReason: string | null;
}

export interface ConversationsResponse {
  page: number;
  limit: number;
  total: number;
  conversations: ConversationPreview[];
}

export interface ConversationMessagesResponse {
  conversationId: string;
  participant: MessageUser;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  messages: Message[];
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  canMessage: boolean;
  blockReason: string | null;
}

export interface SendMessageResponse {
  message: Message;
  conversation: ConversationPreview;
  currentUnreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface AttachResource {
  type: ShareResourceType;
  id: string;
  title: string;
  permalink: string;
  coverArtUrl?: string | null;
}