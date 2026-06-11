'use client';

import { useState } from 'react';

const channelStyles = {
  whatsapp: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  sms: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  email: 'border-violet-500/20 bg-violet-500/10 text-violet-200'
};

const statusStyles = {
  draft: 'bg-gray-400',
  running: 'bg-emerald-400',
  completed: 'bg-indigo-400'
};

const funnelSteps = [
  { key: 'total_sent', label: 'Sent', gradient: 'from-blue-500 to-blue-400' },
  { key: 'total_delivered', label: 'Delivered', gradient: 'from-emerald-500 to-emerald-400' },
  { key: 'total_opened', label: 'Opened', gradient: 'from-amber-500 to-amber-400' },
  { key: 'total_clicked', label: 'Clicked', gradient: 'from-indigo-500 to-indigo-400' }
];

function percent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((Number(value || 0) / total) * 100);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function FunnelBar({ step, campaign, compact = false }) {
  const sent = Number(campaign.total_sent || 0);
  const value = Number(campaign[step.key] || 0);
  const rate = step.key === 'total_sent' && sent > 0 ? 100 : percent(value, sent);

  return (
    <div className={compact ? '' : 'rounded-lg border border-white/10 bg-white/5 p-3'}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-gray-300">{step.label}</span>
        <span className="text-gray-400">
          {formatNumber(value)} · {rate}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${step.gradient}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function CampaignCard({ campaign }) {
  const [expanded, setExpanded] = useState(false);
  const openRate = percent(campaign.total_opened, campaign.total_sent);
  const created = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(campaign.created_at));

  return (
    <article
      className="cursor-pointer rounded-2xl border border-white/6 bg-[#0f0f1a] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.1)]"
      onClick={() => setExpanded((current) => !current)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-100">{campaign.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-[#8b8aa0]">{campaign.segment_description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${channelStyles[campaign.channel] || channelStyles.email}`}>
            {campaign.channel}
          </span>
          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${campaign.status === 'running' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : campaign.status === 'completed' ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-gray-500/20 bg-gray-500/10 text-gray-300'}`}>
            <span className={`h-2 w-2 rounded-full ${statusStyles[campaign.status] || statusStyles.draft}`} />
            {campaign.status}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {funnelSteps.map((step) => (
          <FunnelBar key={step.key} step={step} campaign={campaign} compact />
        ))}
      </div>

      {expanded && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {funnelSteps.map((step) => (
              <FunnelBar key={step.key} step={step} campaign={campaign} />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-[#080810]/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Message Template
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-200">
              {campaign.message_template || 'No message template saved for this campaign.'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4 text-xs text-[#8b8aa0]">
        <span>Created {created}</span>
        <span>Open rate {openRate}%</span>
      </div>
    </article>
  );
}
