'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import CampaignCard from '../../components/CampaignCard';
import Navbar from '../../components/Navbar';
import StatsBanner from '../../components/StatsBanner';
import { getCampaigns } from '../../lib/api';

function CampaignSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const campaignsRef = useRef([]);

  useEffect(() => {
    let active = true;

    async function loadCampaigns() {
      try {
        const data = await getCampaigns();

        if (!active) {
          return;
        }

        const nextCampaigns = Array.isArray(data) ? data : [];
        campaignsRef.current = nextCampaigns;
        setCampaigns(nextCampaigns);
        setError('');
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

    const intervalId = setInterval(() => {
      if (campaignsRef.current.some((campaign) => campaign.status === 'running')) {
        loadCampaigns();
      }
    }, 10000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const summary = useMemo(() => {
    const totalSent = campaigns.reduce((sum, campaign) => sum + Number(campaign.total_sent || 0), 0);
    const totalOpened = campaigns.reduce((sum, campaign) => sum + Number(campaign.total_opened || 0), 0);
    const avgOpenRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      avgOpenRate
    };
  }, [campaigns]);

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="animate-fadeIn">
        <Navbar />
      <section className="px-4 pt-16 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">Campaigns</h1>
              <p className="mt-2 text-sm text-gray-400">Track StyleAura campaign delivery and engagement.</p>
            </div>
            <Link
              href="/chat?message=Create%20a%20new%20campaign%20for%20StyleAura%20with%20smart%20defaults%20for%20at-risk%20customers"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366f1] px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              New Campaign
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              {
                label: '🎯 Target At-Risk',
                href: '/chat?message=Create%20a%20WhatsApp%20campaign%20for%20at-risk%20customers%20with%20a%20re-engagement%20offer'
              },
              {
                label: '💤 Win Back Lapsed',
                href: '/chat?message=Create%20a%20WhatsApp%20campaign%20for%20lapsed%20customers%20with%20a%20comeback%20discount'
              },
              {
                label: '⭐ Reward Active',
                href: '/chat?message=Create%20an%20email%20campaign%20for%20active%20customers%20with%20a%20loyalty%20reward'
              }
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="inline-flex items-center rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/10 hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
              >
                {chip.label}
              </Link>
            ))}
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
            <div className="mt-8 rounded-3xl border border-dashed border-white/12 bg-[#0f0f1a] px-6 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl">
              <p className="text-base font-medium text-zinc-200">No campaigns yet. Ask Maya to create one!</p>
              <Link
                href="/chat?message=Create%20a%20WhatsApp%20campaign%20for%20lapsed%20customers"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#6366f1] px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Open Chat
              </Link>
            </div>
          )}
        </div>
      </section>
      </div>
    </main>
  );
}
