'use client';

const channelStyles = {
  whatsapp: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-green-300',
  sms: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  email: 'border-[#6366f1]/30 bg-[#6366f1]/10 text-indigo-300'
};

const statusStyles = {
  draft: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  running: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-green-300',
  completed: 'border-[#6366f1]/30 bg-[#6366f1]/10 text-indigo-300'
};

function percent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function CampaignCard({ campaign }) {
  const deliveredRate = percent(campaign.total_delivered, campaign.total_sent);
  const openedRate = percent(campaign.total_opened, campaign.total_delivered);
  const clickedRate = percent(campaign.total_clicked, campaign.total_opened);
  const created = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(campaign.created_at));

  return (
    <article className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-zinc-100">{campaign.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{campaign.segment_description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${channelStyles[campaign.channel] || channelStyles.email}`}>
            {campaign.channel}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${statusStyles[campaign.status] || statusStyles.draft}`}>
            {campaign.status}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <div className="text-zinc-500">Sent</div>
          <div className="mt-1 font-semibold text-zinc-100">{campaign.total_sent}</div>
        </div>
        <div>
          <div className="text-zinc-500">Delivered</div>
          <div className="mt-1 font-semibold text-zinc-100">
            {campaign.total_delivered}
            <span className="ml-1 text-xs font-normal text-zinc-500">{deliveredRate}%</span>
          </div>
        </div>
        <div>
          <div className="text-zinc-500">Opened</div>
          <div className="mt-1 font-semibold text-zinc-100">
            {campaign.total_opened}
            <span className="ml-1 text-xs font-normal text-zinc-500">{openedRate}%</span>
          </div>
        </div>
        <div>
          <div className="text-zinc-500">Clicked</div>
          <div className="mt-1 font-semibold text-zinc-100">
            {campaign.total_clicked}
            <span className="ml-1 text-xs font-normal text-zinc-500">{clickedRate}%</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#22c55e]"
            style={{ width: `${Math.min(deliveredRate, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>Delivery rate</span>
          <span>{deliveredRate}%</span>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 text-xs text-zinc-500">
        Created {created}
      </div>
    </article>
  );
}
