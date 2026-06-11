'use client';

export default function StatsBanner({ totalCampaigns, totalSent, avgOpenRate }) {
  const stats = [
    { label: 'Campaigns', value: totalCampaigns },
    { label: 'Messages sent', value: totalSent },
    { label: 'Avg open rate', value: `${avgOpenRate}%` }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
