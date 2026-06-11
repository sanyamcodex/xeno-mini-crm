'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ChatWindow from '../../components/ChatWindow';
import Navbar from '../../components/Navbar';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('message') || searchParams.get('prompt') || '';

  return (
    <main className="flex min-h-screen flex-col bg-[#080810]">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col">
        <ChatWindow initialPrompt={prompt} />
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080810]" />}>
      <ChatPageContent />
    </Suspense>
  );
}
