'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/campaigns', label: 'Campaigns' }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#080810]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-base font-black text-indigo-100 shadow-[0_0_18px_rgba(99,102,241,0.18)]"
            style={{ textShadow: '0 0 18px rgba(99,102,241,0.35)' }}
          >
            ✦
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight text-white">XenoCRM</span>
            <span className="text-xs font-medium text-indigo-300/90">StyleAura</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-[#8b8aa0] hover:text-white'
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                {active && (
                  <span className="absolute inset-x-1 -bottom-1 h-[2px] rounded-full bg-indigo-400 shadow-[0_0_18px_rgba(99,102,241,0.35)]" />
                )}
                {active && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.8)]" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
