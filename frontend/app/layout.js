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
      <body className="min-h-screen bg-[#080810] font-sans text-[#f1f0ff] antialiased">
        {children}
      </body>
    </html>
  );
}
