'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { aiService, AiChatContext, AiChatResponse } from '@/src/services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actionsTaken?: string[];
  suggestions?: string[];
  data?: AiChatResponse['data'];
}

interface AiChatWidgetProps {
  context?: AiChatContext;
}

export function AiChatWidget({ context }: AiChatWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Hi! I can help you discover music, create playlists, queue tracks, send track messages, and answer IQA3 questions.',
      suggestions: [
        'Create a Sha3by playlist',
        'Find trending tracks',
        'Create a playlist with top 10 Sha3by tracks',
        'How do I upload music?',
        'Show my playlists',
        'What is my plan?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<AiChatContext | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildContext = (): AiChatContext => ({
    ...(context ?? {}),
    ...(pendingContext ?? {}),
    currentPage: context?.currentPage ?? pathname ?? undefined,
  });

  const sendText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text,
      },
    ]);
    setLoading(true);

    try {
      const res = await aiService.chat(text, buildContext());

      if (res.pendingContext !== undefined) {
        setPendingContext(res.pendingContext);
      } else if (!res.needsConfirmation) {
        setPendingContext(null);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: res.reply,
          actionsTaken: res.actionsTaken,
          suggestions: res.suggestions,
          data: res.data,
        },
      ]);
    } catch {
      setError('The assistant could not respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendText(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 sm:w-96 h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-lg">
                ♫
              </span>
              <span className="font-semibold text-sm">IQA3 Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-xl leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      {msg.actionsTaken.map((action, index) => (
                        <p key={`${action}-${index}`} className="text-xs opacity-80">
                          ✓ {action}
                        </p>
                      ))}
                    </div>
                  )}

                  <AiResultData data={msg.data} />

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.suggestions.slice(0, 6).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="text-xs bg-white/20 hover:bg-white/30 rounded-full px-2 py-0.5 text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}

            {error && <p className="text-center text-xs text-red-500">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              maxLength={1000}
              className="flex-1 text-sm rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
            <button
              onClick={() => void sendText(input)}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110"
        title="IQA3 Assistant"
        aria-label={isOpen ? 'Close IQA3 Assistant' : 'Open IQA3 Assistant'}
      >
        {isOpen ? '×' : '♫'}
      </button>
    </div>
  );
}

function AiResultData({ data }: { data?: AiChatResponse['data'] }) {
  if (!data || typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;
  const tracks = Array.isArray(record.tracks) ? record.tracks.slice(0, 5) : [];
  const playlists = Array.isArray(record.playlists) ? record.playlists.slice(0, 5) : [];
  const playlist = record.playlist as Record<string, unknown> | undefined;

  return (
    <div className="mt-2 space-y-1">
      {playlist && typeof playlist === 'object' && (
        <div className="rounded-lg bg-black/10 dark:bg-white/10 px-2 py-1 text-xs">
          Playlist: {String(playlist.title ?? playlist.playlistId ?? 'Created playlist')}
        </div>
      )}

      {tracks.map((track, index) => {
        const item = track as Record<string, unknown>;
        return (
          <div key={`track-${index}`} className="rounded-lg bg-black/10 dark:bg-white/10 px-2 py-1 text-xs">
            Track: {String(item.title ?? item.trackId ?? 'Track')}
          </div>
        );
      })}

      {playlists.map((item, index) => {
        const playlistItem = item as Record<string, unknown>;
        return (
          <div key={`playlist-${index}`} className="rounded-lg bg-black/10 dark:bg-white/10 px-2 py-1 text-xs">
            Playlist: {String(playlistItem.title ?? playlistItem.playlistId ?? 'Playlist')}
          </div>
        );
      })}
    </div>
  );
}
