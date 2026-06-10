'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { sendMessage } from '../lib/api';
import MessageBubble from './MessageBubble';

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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#6366f1] text-sm font-semibold text-white">
        M
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}

export default function ChatWindow({ initialPrompt = '' }) {
  const [messages, setMessages] = useState([nowMessage('assistant', welcomeMessage)]);
  const [draft, setDraft] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(event) {
    event?.preventDefault();

    const text = draft.trim();

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
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#0f0f0f]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 sm:text-lg">Maya — AI Marketing Assistant</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span>online</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.map((message, index) => (
            <MessageBubble key={`${message.timestamp.toISOString()}-${index}`} message={message} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-white/10 bg-[#111111] p-4 sm:p-5">
        <div className="mx-auto max-w-4xl">
          {error && <p className="mb-2 text-sm text-[#ef4444]">{error}</p>}
          <div className="flex items-end gap-3 rounded-lg border border-white/10 bg-[#1a1a1a] p-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask Maya to segment customers, draft campaigns, or analyze performance..."
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="h-11 rounded-md bg-[#6366f1] px-5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
