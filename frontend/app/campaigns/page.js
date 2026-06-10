'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CampaignCard from '../../components/CampaignCard';
import StatsBanner from '../../components/StatsBanner';
import { getCampaigns } from '../../lib/api';

function CampaignSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
      <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-10 animate-pulse rounded bg-white/10" />
        ))}
      </div>
      <div className="mt-6 h-2 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#111111] px-4 py-4 md:min-h-screen md:w-60 md:border-b-0 md:border-r md:px-5">
      <div className="flex items-center justify-between md:block">
        <div>
          <div className="text-lg font-bold text-white">XenoCRM</div>
          <div className="mt-0.5 text-xs text-zinc-500">StyleAura</div>
        </div>
        <div className="text-xs text-zinc-500 md:hidden">Powered by Gemini</div>
      </div>

      <nav className="mt-4 flex gap-2 md:mt-8 md:flex-col">
        <Link
          href="/chat"
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
        >
          Chat
        </Link>
        <Link
          href="/campaigns"
          className="rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white"
        >
          Campaigns
        </Link>
      </nav>

      <div className="mt-auto hidden text-xs text-zinc-600 md:block">Powered by Gemini</div>
    </aside>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCampaigns() {
      try {
        const data = await getCampaigns();

        if (active) {
          setCampaigns(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError('Unable to connect to backend');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCampaigns();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.total_sent, 0);
    const totalDelivered = campaigns.reduce((sum, campaign) => sum + campaign.total_delivered, 0);
    const totalOpened = campaigns.reduce((sum, campaign) => sum + campaign.total_opened, 0);
    const avgOpenRate = totalDelivered
      ? Math.round((totalOpened / totalDelivered) * 100)
      : 0;

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      avgOpenRate
    };
  }, [campaigns]);

  return (
    <main className="flex min-h-screen flex-col bg-[#0f0f0f] md:flex-row">
      <Sidebar />
      <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100">Campaigns</h1>
              <p className="mt-1 text-sm text-zinc-500">Track StyleAura campaign delivery and engagement.</p>
            </div>
            <Link
              href="/chat?prompt=Create%20a%20new%20campaign%20for%20StyleAura"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#6366f1] px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              New Campaign
            </Link>
          </div>

          <div className="mt-6">
            <StatsBanner {...summary} />
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {loading &&
              [0, 1, 2, 3].map((item) => <CampaignSkeleton key={item} />)}

            {!loading &&
              !error &&
              campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </div>

          {!loading && !error && campaigns.length === 0 && (
            <div className="mt-8 rounded-lg border border-dashed border-white/15 bg-[#1a1a1a] px-6 py-12 text-center">
              <p className="text-base font-medium text-zinc-200">No campaigns yet. Ask Maya to create one!</p>
              <Link
                href="/chat?prompt=Create%20a%20WhatsApp%20campaign%20for%20lapsed%20customers"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#6366f1] px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Open Chat
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
