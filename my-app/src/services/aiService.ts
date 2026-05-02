import api from './api';

export interface AiChatContext {
  trackId?: string;
  playlistId?: string;
  conversationId?: string;
  currentPage?: string;
}

export interface AiChatResponse {
  reply: string;
  provider: 'mock' | 'openai';
  intent: string;
  actionsTaken: string[];
  data?: Record<string, unknown>;
  suggestions?: string[];
}

export const aiService = {
  chat: async (message: string, context?: AiChatContext): Promise<AiChatResponse> => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },
};
