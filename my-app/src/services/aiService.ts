import api from './api';

export interface AiChatContext {
  trackId?: string;
  playlistId?: string;
  conversationId?: string;
  currentPage?: string;
  pendingIntent?: string;
  pendingGenre?: string;
  pendingLimit?: number;
}

export interface AiChatResponse {
  reply: string;
  provider: 'mock' | 'n8n' | 'openai' | 'ollama';
  intent: string;
  actionsTaken: string[];
  data?: Record<string, unknown>;
  suggestions?: string[];
  needsConfirmation?: boolean;
  pendingContext?: AiChatContext | null;
}

export const aiService = {
  chat: async (message: string, context?: AiChatContext): Promise<AiChatResponse> => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },
};
