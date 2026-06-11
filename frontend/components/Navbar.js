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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080810]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-baseline">
          <span className="text-lg font-bold tracking-normal text-white">✦ XenoCRM</span>
          <span className="ml-2 text-sm font-medium text-indigo-400">StyleAura</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-1 text-sm font-medium transition ${
                  active
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
