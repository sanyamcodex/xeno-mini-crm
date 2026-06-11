'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getCampaigns, getDashboardStats } from '../../lib/api';

const statCards = [
  {
    key: 'total',
    icon: '🧑‍🤝‍🧑',
    label: 'Total Customers',
    description: 'Your full shopper base',
    valueClass: 'text-white'
  },
  {
    key: 'active',
    icon: '🟢',
    label: 'Active',
    description: 'Bought in last 15 days',
    valueClass: 'text-emerald-400'
  },
  {
    key: 'at_risk',
    icon: '🟡',
    label: 'At-Risk',
    description: 'Silent for 16-60 days',
    valueClass: 'text-amber-400'
  },
  {
    key: 'lapsed',
    icon: '🔴',
    label: 'Lapsed',
    description: 'Gone quiet 60+ days',
    valueClass: 'text-red-400'
  }
];

const suggestions = [
  'How many at-risk customers do we have?',
  'Create a WhatsApp campaign for lapsed customers',
  'Show me performance of last campaign'
];

const channelStyles = {
  whatsapp: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  sms: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  email: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300'
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function openRate(campaign) {
  if (!campaign.total_delivered) {
    return 0;
  }

  return Math.round((campaign.total_opened / campaign.total_delivered) * 100);
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [statsData, campaignsData] = await Promise.all([
          getDashboardStats(),
          getCampaigns()
        ]);

        if (active) {
          setStats(statsData);
          setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError('Unable to connect to backend');
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const recentCampaigns = useMemo(() => campaigns.slice(0, 3), [campaigns]);

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-white">Good morning, StyleAura 👋</h1>
          <p className="mt-2 text-gray-400">Here&apos;s what&apos;s happening with your shoppers today.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.key}
              className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur transition hover:scale-[1.02]"
            >
              <div className="text-2xl">{card.icon}</div>
              <div className={`mt-4 text-4xl font-black ${card.valueClass}`}>
                {stats ? formatNumber(stats[card.key]) : '...'}
              </div>
              <h2 className="mt-2 text-sm font-semibold text-white">{card.label}</h2>
              <p className="mt-1 text-sm text-gray-400">{card.description}</p>
            </article>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-200">
                ✦ Maya
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white">Your AI Marketing Brain</h2>
              <p className="mt-3 max-w-2xl text-gray-300">
                Just describe what you want. Maya segments, drafts, and launches - instantly.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/chat?message=${encodeURIComponent(suggestion)}`}
                    className="cursor-pointer rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>

              <Link
                href="/chat"
                className="mt-7 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                Open Maya →
              </Link>
            </div>

            <div className="hidden lg:block">
              <div className="ml-auto max-w-md rounded-2xl border border-white/10 bg-[#080810]/55 p-4 shadow-2xl backdrop-blur">
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">Maya is online</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white">
                    Create campaign for lapsed users
                  </div>
                  <div className="max-w-[86%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 text-gray-100">
                    Sure! I found 30 lapsed customers. Drafting message now...
                    <div className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-emerald-300">
                      ✓ Campaign created
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Recent Campaigns</h2>
            <Link href="/campaigns" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              View all →
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {recentCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 truncate text-base font-semibold text-white">{campaign.name}</h3>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${channelStyles[campaign.channel] || channelStyles.email}`}>
                    {campaign.channel}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <span className={`h-2 w-2 rounded-full ${campaign.status === 'running' ? 'bg-emerald-400' : campaign.status === 'completed' ? 'bg-indigo-400' : 'bg-gray-500'}`} />
                  <span>{campaign.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Sent</div>
                    <div className="mt-1 font-semibold text-white">{formatNumber(campaign.total_sent)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Open rate</div>
                    <div className="mt-1 font-semibold text-white">{openRate(campaign)}%</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!error && recentCampaigns.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-gray-400 backdrop-blur">
              No campaigns yet - ask Maya to create one!
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
