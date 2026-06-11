'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sendMessage } from '../lib/api';
import MessageBubble from './MessageBubble';

const STORAGE_KEY = 'maya_chat_history';

const welcomeMessage =
  "Hi! I'm Maya, your AI marketing assistant for StyleAura. I can help you segment customers, create campaigns, and track performance. Try asking: 'How many at-risk customers do we have?' or 'Create a WhatsApp campaign for lapsed customers'";

function nowMessage(role, content, toolsUsed = []) {
  return {
    role,
    content,
    toolsUsed,
    timestamp: new Date()
  };
}

function hydrateMessage(message) {
  return {
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
  };
}

function serializeMessages(messages) {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp
  }));
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#6366f1] text-sm font-semibold text-white">
        M
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}

export default function ChatWindow({ initialPrompt = '' }) {
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') {
      return [nowMessage('assistant', welcomeMessage)];
    }

    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return [nowMessage('assistant', welcomeMessage)];
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(hydrateMessage);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }

    return [nowMessage('assistant', welcomeMessage)];
  });
  const [draft, setDraft] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const autoSentRef = useRef(false);

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
    [messages]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializeMessages(messages)));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendText = useCallback(
    async (textValue) => {
      const text = textValue.trim();

      if (!text || loading) {
        return;
      }

      const userMessage = nowMessage('user', text);
      setMessages((current) => [...current, userMessage]);
      setDraft('');
      setError('');
      setLoading(true);

      try {
        const result = await sendMessage(text, conversationHistory);
        setMessages((current) => [
          ...current,
          nowMessage('assistant', result.reply, result.toolsUsed || [])
        ]);
      } catch (err) {
        setError('Unable to connect to backend');
        setMessages((current) => [
          ...current,
          nowMessage('assistant', 'Unable to connect to backend')
        ]);
      } finally {
        setLoading(false);
      }
    },
    [conversationHistory, loading]
  );

  useEffect(() => {
    if (!initialPrompt || autoSentRef.current) {
      return undefined;
    }

    autoSentRef.current = true;
    setDraft(initialPrompt);

    const timer = setTimeout(() => {
      sendText(initialPrompt);
    }, 500);

    return () => clearTimeout(timer);
  }, [initialPrompt, sendText]);

  function handleSend(event) {
    event?.preventDefault();
    sendText(draft);
  }

  function handleClearChat() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }

    setMessages([nowMessage('assistant', welcomeMessage)]);
    setDraft('');
    setError('');
    autoSentRef.current = false;
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#080810]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/6 bg-[#0f0f1a]/90 px-4 backdrop-blur-xl sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 sm:text-lg">Maya - AI Marketing Assistant</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span>online</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
        >
          Clear Chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.timestamp instanceof Date ? message.timestamp.toISOString() : String(message.timestamp)}-${index}`}
              message={message}
            />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-white/6 bg-[#080810]/95 p-4 backdrop-blur-xl sm:p-5">
        <div className="mx-auto max-w-4xl">
          {error && <p className="mb-2 text-sm text-[#ef4444]">{error}</p>}
          <div className="flex items-end gap-3 rounded-2xl border border-white/8 bg-[#0f0f1a] p-2 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-200 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask Maya to segment customers, draft campaigns, or analyze performance..."
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-[#f1f0ff] outline-none placeholder:text-[#4a4960]"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(99,102,241,0.25)] transition-all duration-200 hover:bg-indigo-500 hover:shadow-[0_0_24px_rgba(99,102,241,0.35)] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-400 disabled:shadow-none"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
