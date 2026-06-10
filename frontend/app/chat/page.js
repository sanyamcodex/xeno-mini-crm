'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ChatWindow from '../../components/ChatWindow';

function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#111111] px-4 py-4 md:h-screen md:w-60 md:border-b-0 md:border-r md:px-5">
      <div className="flex items-center justify-between md:block">
        <div>
          <div className="text-lg font-bold tracking-normal text-white">XenoCRM</div>
          <div className="mt-0.5 text-xs text-zinc-500">StyleAura</div>
        </div>
        <div className="text-xs text-zinc-500 md:hidden">Powered by Gemini</div>
      </div>

      <nav className="mt-4 flex gap-2 md:mt-8 md:flex-col">
        <Link
          href="/chat"
          className="rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white"
        >
          Chat
        </Link>
        <Link
          href="/campaigns"
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
        >
          Campaigns
        </Link>
      </nav>

      <div className="mt-auto hidden text-xs text-zinc-600 md:block">Powered by Gemini</div>
    </aside>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt') || '';

  return (
    <main className="flex min-h-screen flex-col bg-[#0f0f0f] md:flex-row">
      <Sidebar />
      <div className="h-[calc(100vh-137px)] min-h-0 flex-1 md:h-screen">
        <ChatWindow initialPrompt={prompt} />
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <ChatPageContent />
    </Suspense>
  );
}
