'use client';

export default function StatsBanner({ totalCampaigns, totalSent, avgOpenRate }) {
  const stats = [
    { label: 'Campaigns', value: totalCampaigns },
    { label: 'Messages sent', value: totalSent },
    { label: 'Avg open rate', value: `${avgOpenRate}%` }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-2xl border border-white/6 bg-[#0f0f1a] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.1)]"
        >
          <div className="text-[11px] uppercase tracking-[0.35em] text-[#8b8aa0]">{stat.label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">{stat.value}</div>
        </article>
      ))}
    </div>
  );
}
