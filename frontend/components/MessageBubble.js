'use client';

function toolLabel(tool) {
  const labels = {
    get_customer_stats: 'get_customer_stats',
    get_customers: 'get_customers',
    create_campaign: 'create_campaign',
    launch_campaign: 'launch_campaign',
    get_campaign_stats: 'get_campaign_stats'
  };

  return labels[tool] || tool;
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
          className={`rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
            isUser
              ? 'bg-[#6366f1] text-white'
              : 'border border-white/10 bg-[#1a1a1a] text-[#e5e5e5]'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {message.toolsUsed?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.toolsUsed.map((tool, index) => (
              <span
                key={`${tool}-${index}`}
                className="rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-200"
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
