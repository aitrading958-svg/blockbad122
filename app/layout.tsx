import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Klustra Order Flow & MMXM Scalping Engine',
  description: 'Real-time M1/M5/M15/H1 crypto and XAUUSD order flow analytics, footprint charts, volume profile, DOM liquidity, absorption detection, and 24/7 15-minute MMXM/IPDA auto-signals.',
  openGraph: {
    title: 'Klustra Order Flow & MMXM Scalping Engine',
    description: 'Real-time M1/M5/M15/H1 crypto and XAUUSD order flow analytics, footprint charts, volume profile, DOM liquidity, absorption detection, and 24/7 15-minute MMXM/IPDA auto-signals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klustra Order Flow & MMXM Scalping Engine',
    description: 'Real-time M1/M5/M15/H1 crypto and XAUUSD order flow analytics, footprint charts, volume profile, DOM liquidity, absorption detection, and 24/7 15-minute MMXM/IPDA auto-signals.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
