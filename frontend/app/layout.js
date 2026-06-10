import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata = {
  title: 'XenoCRM — StyleAura',
  description: 'AI-native mini CRM for StyleAura retail campaigns'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0f0f0f] font-sans text-[#e5e5e5] antialiased">
        {children}
      </body>
    </html>
  );
}
