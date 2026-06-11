'use client';

function toolLabel(tool) {
  const icons = {
    get_customer_stats: '📊',
    get_customers: '👥',
    create_campaign: '✏️',
    launch_campaign: '🚀',
    get_campaign_stats: '📈'
  };

  return `${icons[tool] || '✦'} ${tool}`;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(message.timestamp);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#6366f1] text-sm font-semibold text-white">
          M
        </div>
      )}

      <div className={`max-w-[86%] sm:max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm transition-all duration-200 ${
            isUser
              ? 'rounded-br-sm bg-indigo-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]'
              : 'rounded-bl-sm border border-white/6 bg-[#13131f] text-[#e8e7ff] shadow-[0_1px_4px_rgba(0,0,0,0.3)] backdrop-blur'
          }`}
          style={isUser ? { boxShadow: '0 2px 12px rgba(99,102,241,0.25)' } : { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {message.toolsUsed?.length > 0 && (
          <div className="mt-2 inline-flex flex-wrap gap-1">
            {message.toolsUsed.map((tool, index) => (
              <span
                key={`${tool}-${index}`}
                className="rounded-full border border-indigo-800/40 bg-indigo-950/60 px-2.5 py-1 text-xs text-indigo-200 backdrop-blur-sm"
              >
                {toolLabel(tool)}
              </span>
            ))}
          </div>
        )}

        <span className="mt-1 text-[11px] text-zinc-500">{time}</span>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/10 text-sm font-semibold text-zinc-100">
          U
        </div>
      )}
    </div>
  );
}
